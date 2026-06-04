package com.zionex.t3composer.domain.ontology.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zionex.t3composer.domain.ontology.entity.OntologyExtension;

public interface OntologyExtensionRepository extends JpaRepository<OntologyExtension, UUID> {

    Optional<OntologyExtension> findByTargetCdAndKindAndRefId(
            String targetCd, String kind, String refId);

    List<OntologyExtension> findByTargetCdAndKindAndRefIdIn(
            String targetCd, String kind, List<String> refIds);

    void deleteByTargetCdAndKindAndRefId(String targetCd, String kind, String refId);
}
