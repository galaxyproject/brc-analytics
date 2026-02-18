package org.galaxyproject.keycloak;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.util.Base64;

/**
 * Verifies passwords against Galaxy's stored hash format.
 *
 * Galaxy stores passwords in galaxy_user.password as:
 *   PBKDF2$sha256$<iterations>$<base64-salt>$<base64-hash>
 *
 * Important: Galaxy's salt is "double-encoded" — 12 random bytes are
 * base64-encoded to produce a 16-char ASCII string, and that ASCII string
 * (not the decoded bytes) is used directly as the PBKDF2 salt input.
 * The hash output is then base64-encoded for storage, and verification
 * compares base64-encoded strings.
 *
 * Parameters: PBKDF2-HMAC-SHA256, key length 24 bytes, 100k iterations.
 * Legacy accounts may have plain hex SHA-1 hashes (no $ delimiter).
 *
 * See: lib/galaxy/security/passwords.py in galaxyproject/galaxy
 */
public final class GalaxyPasswordUtil {

    private GalaxyPasswordUtil() {}

    public static boolean verify(String password, String storedHash) {
        if (storedHash == null || storedHash.isEmpty()) {
            return false;
        }

        if (storedHash.startsWith("PBKDF2$")) {
            return verifyPbkdf2(password, storedHash);
        }

        // Legacy: plain hex SHA-1 (very old Galaxy accounts)
        if (storedHash.length() == 40 && storedHash.matches("[0-9a-f]+")) {
            return verifySha1Hex(password, storedHash);
        }

        return false;
    }

    private static final int KEY_LENGTH = 24;

    private static boolean verifyPbkdf2(String password, String storedHash) {
        // Format: PBKDF2$sha256$<iterations>$<base64-salt>$<base64-hash>
        String[] parts = storedHash.split("\\$");
        if (parts.length != 5) {
            return false;
        }

        try {
            int iterations = Integer.parseInt(parts[2]);
            // Galaxy uses the base64 salt string itself as PBKDF2 input
            // (not the decoded bytes). See lib/galaxy/security/passwords.py
            byte[] salt = parts[3].getBytes(StandardCharsets.UTF_8);
            String expectedB64 = parts[4];

            PBEKeySpec spec = new PBEKeySpec(
                password.toCharArray(), salt, iterations, KEY_LENGTH * 8
            );
            SecretKeyFactory skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] actual = skf.generateSecret(spec).getEncoded();
            String actualB64 = Base64.getEncoder().encodeToString(actual);

            return MessageDigest.isEqual(
                actualB64.getBytes(StandardCharsets.UTF_8),
                expectedB64.getBytes(StandardCharsets.UTF_8)
            );
        } catch (IllegalArgumentException | NoSuchAlgorithmException
                 | InvalidKeySpecException e) {
            return false;
        }
    }

    private static boolean verifySha1Hex(String password, String storedHex) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] hash = md.digest(password.getBytes());
            String computed = bytesToHex(hash);
            return MessageDigest.isEqual(
                computed.getBytes(), storedHex.getBytes()
            );
        } catch (NoSuchAlgorithmException e) {
            return false;
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
