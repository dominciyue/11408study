package com.study11408.repository;

import com.study11408.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    List<Material> findByNodeId(Long nodeId);

    List<Material> findByUploaderId(Long uploaderId);
}
