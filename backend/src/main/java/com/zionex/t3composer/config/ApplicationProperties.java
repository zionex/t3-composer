package com.zionex.t3composer.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import lombok.Data;

/**
 * 부모 wingui 의 com.zionex.t3composer.config.ApplicationProperties stub.
 * Composer 코드는 props.getComposer() 만 사용하므로 그것만 노출.
 *
 * sync 시 import 패키지만 wingui 로 변경하면 그대로 동작.
 */
@Data
@Component
public class ApplicationProperties {

    @Autowired
    private ComposerProperties composer;
}
