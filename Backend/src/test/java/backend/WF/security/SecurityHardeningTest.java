package backend.WF.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
        "jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "jwt.expiration-ms=86400000",
        "jwt.access-expiration-ms=900000",
        "jwt.refresh-expiration-ms=604800000"
})
public class SecurityHardeningTest {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtProperties jwtProperties;

    @Test
    public void testPasswordEncoderIsNotNull() {
        assertNotNull(passwordEncoder, "PasswordEncoder should be autowired");
    }

    @Test
    public void testJwtPropertiesAreLoaded() {
        assertNotNull(jwtProperties.getSecret(), "JWT secret should be loaded");
        assertTrue(jwtProperties.getSecret().length() >= 32, "JWT secret must be at least 32 chars");
        assertTrue(jwtProperties.getExpirationMs() > 0, "Expiration must be positive");
    }

    @Test
    public void testBCryptPasswordEncoding() {
        String rawPassword = "TestPassword123!@#";
        String encodedPassword = passwordEncoder.encode(rawPassword);

        assertNotEquals(rawPassword, encodedPassword, "Password should be encoded");
        assertTrue(passwordEncoder.matches(rawPassword, encodedPassword),
                "Encoded password should match raw password");
    }

    @Test
    public void testPasswordEncoderRejectsWrongPassword() {
        String rawPassword = "TestPassword123!@#";
        String encodedPassword = passwordEncoder.encode(rawPassword);
        String wrongPassword = "WrongPassword123!@#";

        assertFalse(passwordEncoder.matches(wrongPassword, encodedPassword),
                "Wrong password should not match");
    }

    @Test
    public void testBCryptHashesAreUnique() {
        String password = "TestPassword123!@#";
        String hash1 = passwordEncoder.encode(password);
        String hash2 = passwordEncoder.encode(password);

        assertNotEquals(hash1, hash2, "Two hashes of same password should be different (different salts)");
        assertTrue(passwordEncoder.matches(password, hash1), "Both hashes should match the password");
        assertTrue(passwordEncoder.matches(password, hash2), "Both hashes should match the password");
    }

    @Test
    public void testTokenExpirationTimes() {
        assertEquals(86400000, jwtProperties.getExpirationMs(), "Legacy expiration should be 24 hours");
        assertEquals(900000, jwtProperties.getAccessExpirationMs(), "Access token should be 15 minutes");
        assertEquals(604800000, jwtProperties.getRefreshExpirationMs(), "Refresh token should be 7 days");
    }

    @Test
    public void testAccessTokenIsShorterThanRefreshToken() {
        assertTrue(jwtProperties.getAccessExpirationMs() < jwtProperties.getRefreshExpirationMs(),
                "Access token expiration should be shorter than refresh token");
    }
}
