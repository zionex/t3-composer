package com.zionex.t3composer.domain.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zionex.t3composer.domain.entity.TargetRule;

public interface TargetRuleRepository extends JpaRepository<TargetRule, String> {

    List<TargetRule> findByTargetCdAndUseYnOrderByPriorityAscRuleCodeAsc(String targetCd, String useYn);

    Optional<TargetRule> findFirstByTargetCdAndRuleCodeOrderByRuleVersionDesc(String targetCd, String ruleCode);

    long countByTargetCd(String targetCd);

    long countByTargetCdAndUseYn(String targetCd, String useYn);
}
