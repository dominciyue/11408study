package com.study11408.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "materials")
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(length = 50)
    private String type;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "original_name")
    private String originalName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "node_id", insertable = false, updatable = false)
    private Long nodeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "node_id")
    private KnowledgeNode node;

    @Column(name = "uploader_id", insertable = false, updatable = false)
    private Long uploaderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id")
    private User uploader;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
