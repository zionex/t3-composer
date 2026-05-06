package com.zionex.t3composer.shared.util;

import com.fasterxml.uuid.Generators;
import com.fasterxml.uuid.impl.TimeBasedEpochGenerator;

import java.util.UUID;

public class SqlUtils {

    private static final TimeBasedEpochGenerator generator = Generators.timeBasedEpochGenerator();

    public static String createUUID() {
        UUID uuid = generator.generate();
        return uuid.toString().replace("-", "");
    }

}
