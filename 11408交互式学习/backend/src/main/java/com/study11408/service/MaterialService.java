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

    @Value("${app.minio.bucket}")
    private String bucket;

    @Value("${app.minio.endpoint}")
    private String endpoint;

    @Transactional
    public Material uploadMaterial(MultipartFile file, String title, Long nodeId, Long uploaderId) {
        try {
            boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!bucketExists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }

            String originalName = file.getOriginalFilename();
            String extension = originalName != null && originalName.contains(".")
                    ? originalName.substring(originalName.lastIndexOf("."))
                    : "";
            String objectName = UUID.randomUUID() + extension;

            try (InputStream inputStream = file.getInputStream()) {
                minioClient.putObject(PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(objectName)
                        .stream(inputStream, file.getSize(), -1)
                        .contentType(file.getContentType())
                        .build());
            }

            String fileUrl = endpoint + "/" + bucket + "/" + objectName;

            User uploader = userRepository.findById(uploaderId)
                    .orElseThrow(() -> new BusinessException("用户不存在", HttpStatus.NOT_FOUND));

            Material.MaterialBuilder builder = Material.builder()
                    .title(title != null ? title : originalName)
                    .type(file.getContentType())
                    .fileUrl(fileUrl)
                    .originalName(originalName)
                    .fileSize(file.getSize())
                    .uploader(uploader);

            if (nodeId != null) {
                KnowledgeNode node = nodeRepository.findById(nodeId)
                        .orElseThrow(() -> new BusinessException("知识节点不存在", HttpStatus.NOT_FOUND));
                builder.node(node);
            }

            return materialRepository.save(builder.build());
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("文件上传失败", e);
            throw new BusinessException("文件上传失败: " + e.getMessage());
        }
    }

    public List<Material> getMaterialsByNodeId(Long nodeId) {
        return materialRepository.findByNodeId(nodeId);
    }

    public List<Material> getAllMaterials() {
        return materialRepository.findAll();
    }

    @Transactional
    public void deleteMaterial(Long id) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new BusinessException("资料不存在", HttpStatus.NOT_FOUND));

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
