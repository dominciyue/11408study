package com.study11408.service;

import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.Material;
import com.study11408.entity.User;
import com.study11408.exception.BusinessException;
import com.study11408.repository.KnowledgeNodeRepository;
import com.study11408.repository.MaterialRepository;
import com.study11408.repository.UserRepository;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MaterialService {

    private final MaterialRepository materialRepository;
    private final KnowledgeNodeRepository nodeRepository;
    private final UserRepository userRepository;
    private final MinioClient minioClient;

    private static final java.util.Set<String> ALLOWED_MIME = java.util.Set.of(
        "application/pdf",
        "image/jpeg", "image/png", "image/webp", "image/gif",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
        "text/plain", "text/markdown"
    );

    private static final java.util.Set<String> ALLOWED_EXT = java.util.Set.of(
        ".pdf", ".jpg", ".jpeg", ".png", ".webp", ".gif",
        ".doc", ".docx", ".ppt", ".pptx", ".txt", ".md"
    );

    private static final long MAX_FILE_SIZE_BYTES = 50L * 1024 * 1024; // 50 MB

    @Value("${app.minio.bucket}")
    private String bucket;

    @Value("${app.minio.endpoint}")
    private String endpoint;

    @Transactional
    public Material uploadMaterial(MultipartFile file, String title, Long nodeId, Long uploaderId) {
        // 1. 大小双层校验(Spring multipart 100MB 兜底, 这里业务层 50MB)
        if (file == null || file.isEmpty()) {
            throw new BusinessException("文件不能为空", HttpStatus.BAD_REQUEST);
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BusinessException("文件超过 50MB 上限", HttpStatus.PAYLOAD_TOO_LARGE);
        }
        // 2. MIME 白名单(客户端可伪造 Content-Type, 但和扩展名双校验已经把
        //    随便改 .exe 改成 .pdf 的常见攻击挡掉. 真要绕过得既改 MIME 又改后缀
        //    再绕过浏览器/MIME 嗅探, 成本/收益不划算)
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME.contains(contentType.toLowerCase())) {
            throw new BusinessException(
                "不支持的文件类型: " + contentType + " (仅允许 PDF / 图片 / Word / PPT / 文本)",
                HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        }

        // 先校验依赖，避免 MinIO put 成功后才发现用户/节点不存在 → 孤儿对象
        User uploader = userRepository.findById(uploaderId)
                .orElseThrow(() -> new BusinessException("用户不存在", HttpStatus.NOT_FOUND));
        KnowledgeNode node = null;
        if (nodeId != null) {
            node = nodeRepository.findById(nodeId)
                    .orElseThrow(() -> new BusinessException("知识节点不存在", HttpStatus.NOT_FOUND));
        }

        String originalName = file.getOriginalFilename();
        String extension = originalName != null && originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf(".")).toLowerCase()
                : "";
        if (!ALLOWED_EXT.contains(extension)) {
            throw new BusinessException(
                "不支持的文件扩展名: " + extension,
                HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        }
        String objectName = UUID.randomUUID() + extension;

        try {
            boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!bucketExists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }

            try (InputStream inputStream = file.getInputStream()) {
                minioClient.putObject(PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(objectName)
                        .stream(inputStream, file.getSize(), -1)
                        .contentType(file.getContentType())
                        .build());
            }
        } catch (Exception e) {
            log.error("MinIO 上传失败", e);
            throw new BusinessException("文件上传失败: " + e.getMessage());
        }

        // MinIO 写成功后再保存 DB；若 save 抛任何异常，best-effort 清掉孤儿对象
        // 否则用户/管理员永远看不到该文件但 bucket 仍占空间。
        String fileUrl = endpoint + "/" + bucket + "/" + objectName;
        Material.MaterialBuilder builder = Material.builder()
                .title(title != null ? title : originalName)
                .type(file.getContentType())
                .fileUrl(fileUrl)
                .originalName(originalName)
                .fileSize(file.getSize())
                .uploader(uploader);
        if (node != null) builder.node(node);

        try {
            return materialRepository.save(builder.build());
        } catch (RuntimeException dbFail) {
            log.error("Material 入库失败，尝试回滚 MinIO 对象 {}", objectName, dbFail);
            try {
                minioClient.removeObject(RemoveObjectArgs.builder()
                        .bucket(bucket).object(objectName).build());
            } catch (Exception cleanupFail) {
                log.warn("MinIO 孤儿对象清理失败（需人工介入）: {} / {}",
                        objectName, cleanupFail.getMessage());
            }
            throw dbFail;
        }
    }

    public List<Material> getMaterialsByNodeId(Long nodeId) {
        return materialRepository.findByNodeId(nodeId);
    }

    public List<Material> getAllMaterials() {
        return materialRepository.findAll();
    }

    /** 前端 chip 标签 → MIME 前缀；非 alias 字符串按原样前缀匹配。 */
    private static String resolveTypePrefix(String type) {
        if (type == null) return null;
        String t = type.trim();
        if (t.isEmpty()) return null;
        String upper = t.toUpperCase();
        switch (upper) {
            case "PDF": return "application/pdf";
            case "IMAGE": return "image/";
            case "VIDEO": return "video/";
            case "DOC": return "application/msword";
            case "DOCX": return "application/vnd.openxmlformats-officedocument.wordprocessingml";
            case "TEXT": return "text/";
            default: return t.toLowerCase();
        }
    }

    /** 按学科 / type 筛选；type 标签先 alias 映射 MIME 前缀，再前缀匹配（忽略大小写）。 */
    public List<Material> searchMaterials(Long subjectId, String type) {
        List<Material> base = subjectId != null
                ? materialRepository.findBySubjectId(subjectId)
                : materialRepository.findAll();
        String prefix = resolveTypePrefix(type);
        if (prefix == null) return base;
        return base.stream()
                .filter(m -> m.getType() != null && m.getType().toLowerCase().startsWith(prefix))
                .toList();
    }

    /** ownership 校验：仅上传者本人或管理员可删；普通用户删别人的资料 → 403。 */
    @Transactional
    public void deleteMaterial(Long id, Long currentUserId) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new BusinessException("资料不存在", HttpStatus.NOT_FOUND));

        Long uploaderId = material.getUploader() != null
                ? material.getUploader().getId() : material.getUploaderId();
        if (uploaderId == null || !uploaderId.equals(currentUserId)) {
            // 允许管理员删（admin role）；非管理员且非上传者一律拒绝。
            User u = userRepository.findById(currentUserId).orElse(null);
            if (u == null || !"ADMIN".equalsIgnoreCase(u.getRole())) {
                throw new BusinessException("无权删除该资料", HttpStatus.FORBIDDEN);
            }
        }

        try {
            String fileUrl = material.getFileUrl();
            String objectName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectName)
                    .build());
        } catch (Exception e) {
            log.warn("MinIO文件删除失败: {}", e.getMessage());
        }

        materialRepository.deleteById(id);
    }
}
