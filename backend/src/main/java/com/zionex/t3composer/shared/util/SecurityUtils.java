package com.zionex.t3composer.shared.util;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.jasypt.digest.config.SimpleDigesterConfig;
import org.jasypt.encryption.pbe.PBEByteEncryptor;
import org.jasypt.encryption.pbe.PBEStringEncryptor;
import org.jasypt.encryption.pbe.StandardPBEByteEncryptor;
import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
import org.jasypt.util.password.ConfigurablePasswordEncryptor;
import org.jasypt.util.password.PasswordEncryptor;

public abstract class SecurityUtils {

    private enum DigestType {

        TYPE_1 {
            public String getAlgorithm() { return "SHA-256"; }
            public boolean isDefault() { return true; }
        },
        TYPE_2 {
            public String getAlgorithm() { return "SHA-384"; }
        },
        TYPE_3 {
            public String getAlgorithm() { return "SHA-512"; }
        },
        TYPE_4 {
            public String getAlgorithm() { return "WHIRLPOOL"; }
            public boolean isUseBCProvider() { return true; }
        };

        public String getAlgorithm() { return null; }
        public boolean isDefault() { return false; }
        public boolean isUseBCProvider() { return false; }

        public static DigestType getDigestType() {
            for (DigestType type : DigestType.values()) {
                if (type.isDefault()) {
                    return type;
                }
            }
            return TYPE_1;
        }

    }

    private enum PBEType {

        TYPE_1 {
            public String getAlgorithm() { return "PBEWITHMD5ANDDES"; }
        },
        TYPE_2 {
            public String getAlgorithm() { return "PBEWITHMD5ANDTRIPLEDES"; }
        },
        TYPE_3 {
            public String getAlgorithm() { return "PBEWITHSHA1ANDDESEDE"; }
        },
        TYPE_4 {
            public String getAlgorithm() { return "PBEWITHMD5AND256BITAES-CBC-OPENSSL"; }
            public boolean isUseBCProvider() { return true; }
            public boolean isDefault() { return true; }
        },
        TYPE_5 {
            public String getAlgorithm() { return "PBEWITHSHA256AND128BITAES-CBC-BC"; }
            public boolean isUseBCProvider() { return true; }
        },
        TYPE_6 {
            public String getAlgorithm() { return "PBEWITHSHA256AND256BITAES-CBC-BC"; }
            public boolean isUseBCProvider() { return true; }
        };

        public String getAlgorithm() { return null; }
        public boolean isDefault() { return false; }
        public boolean isUseBCProvider() { return false; }

        public static PBEType getPBEType() {
            for (PBEType type : PBEType.values()) {
                if (type.isDefault()) {
                    return type;
                }
            }
            return TYPE_4;
        }

    }

    private static PasswordEncryptor getPasswordEncryptor() {
        DigestType type = DigestType.getDigestType();

        ConfigurablePasswordEncryptor encryptor = new ConfigurablePasswordEncryptor();
        encryptor.setAlgorithm(type.getAlgorithm());

        if (type.isUseBCProvider()) {
            encryptor.setProvider(new BouncyCastleProvider());
        }

        SimpleDigesterConfig config = new SimpleDigesterConfig();
        config.setIterations(100000);
        config.setSaltSizeBytes(16);
        encryptor.setConfig(config);

        return encryptor;
    }

    private static String getSecurityKey(String key) {
        return key == null ? "mypassword" : key;
    }

    private static PBEStringEncryptor getPBEStringEncryptor(String key) {
        StandardPBEStringEncryptor encryptor = new StandardPBEStringEncryptor();
        PBEType type = PBEType.getPBEType();

        encryptor.setAlgorithm(type.getAlgorithm());
        encryptor.setPassword(getSecurityKey(key));

        if (type.isUseBCProvider()) {
            encryptor.setProvider(new BouncyCastleProvider());
        }

        return encryptor;
    }

    private static PBEByteEncryptor getPBEByteEncryptor(String key) {
        StandardPBEByteEncryptor encryptor = new StandardPBEByteEncryptor();
        PBEType type = PBEType.getPBEType();

        encryptor.setAlgorithm(type.getAlgorithm());
        encryptor.setPassword(getSecurityKey(key));

        if (type.isUseBCProvider()) {
            encryptor.setProvider(new BouncyCastleProvider());
        }

        return encryptor;
    }

    public static String encrypt(String message) {
        return encrypt(message, null);
    }

    public static String decrypt(String message) {
        return decrypt(message, null);
    }

    public static byte[] encrypt(byte[] message) {
        return encrypt(message, null);
    }

    public static byte[] decrypt(byte[] message) {
        return decrypt(message, null);
    }

    public static String encrypt(String message, String key) {
        PBEStringEncryptor encryptor = getPBEStringEncryptor(key);
        return encryptor.encrypt(message);
    }

    public static String decrypt(String message, String key) {
        PBEStringEncryptor encryptor = getPBEStringEncryptor(key);
        return encryptor.decrypt(message);
    }

    public static byte[] encrypt(byte[] message, String key) {
        PBEByteEncryptor encryptor = getPBEByteEncryptor(key);
        return encryptor.encrypt(message);
    }

    public static byte[] decrypt(byte[] message, String key) {
        PBEByteEncryptor encryptor = getPBEByteEncryptor(key);
        return encryptor.decrypt(message);
    }

    public static String encryptPassword(String password) {
        PasswordEncryptor encryptor = getPasswordEncryptor();
        return encryptor.encryptPassword(password);
    }

    public static boolean checkPassword(String plainPassword, String encryptedPassword) {
        PasswordEncryptor encryptor = getPasswordEncryptor();

        try {
            return encryptor.checkPassword(plainPassword, encryptedPassword);
        } catch (Exception e) {
            return false;
        }
    }

    public static String decryptWithAll(String message, String key) {
        String decrypted = null;

        for (PBEType type : PBEType.values()) {
            try {
                StandardPBEStringEncryptor encryptor = new StandardPBEStringEncryptor();
                encryptor.setAlgorithm(type.getAlgorithm());
                encryptor.setPassword(getSecurityKey(key));

                if (type.isUseBCProvider()) {
                    encryptor.setProvider(new BouncyCastleProvider());
                }

                decrypted = encryptor.decrypt(message);
                break;
            } catch (Exception ignored) {
            }
        }

        return decrypted;
    }

    public static void usage() {
        String usage = "Usage : " +
                "Encryption [args : {0}, {1}]\n" +
                "{0} : The password to be encrypted\n" +
                "{1} : Whether the {0} argument is plain text. [true or false]\n";

        System.out.println(usage);
    }

    public static void main(String[] args) throws Exception {
        if (args.length == 0) {
            args = new String[] { "zionex" };
        }

        String password = args[0];
        String encrypted = SecurityUtils.encryptPassword(password);

        if (SecurityUtils.checkPassword(password, encrypted)) {
            System.out.println("Encrypt: [" + password + "]->[" + encrypted + "]");
        } else {
            System.out.println("is false");
        }
    }

}
