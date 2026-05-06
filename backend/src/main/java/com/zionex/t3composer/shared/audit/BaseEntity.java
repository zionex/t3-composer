package com.zionex.t3composer.shared.audit;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import lombok.Getter;
import lombok.Setter;

/**
 * 부모 wingui 의 com.zionex.t3composer.shared.audit.BaseEntity 와 동일 시그니처.
 * sync 시 패키지 rename 만으로 wingui 호환.
 */
@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public class BaseEntity {

    @CreatedBy
    @Column(name = "CREATE_BY", updatable = false)
    private String createBy;

    @Setter
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @CreatedDate
    @Column(name = "CREATE_DTTM", updatable = false)
    private LocalDateTime createDttm;

    @LastModifiedBy
    @Column(name = "MODIFY_BY", insertable = false)
    private String modifyBy;

    @Setter
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @LastModifiedDate
    @Column(name = "MODIFY_DTTM", insertable = false)
    private LocalDateTime modifyDttm;
}
