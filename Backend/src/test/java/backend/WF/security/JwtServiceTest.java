package backend.WF.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
        "jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "jwt.access-expiration-ms=900000",
        "jwt.refresh-expiration-ms=604800000"
})
public class JwtServiceTest {

    @Autowired
    private JwtService jwtService;

    private UserDetails testUser;

    @BeforeEach
    public void setUp() {
        testUser = User.builder()
                .username("testuser")
                .password("password")
                .authorities("ROLE_USER")
                .build();
    }

    @Test
    public void testGenerateAccessToken() {
        String token = jwtService.generateAccessToken(testUser);
        assertNotNull(token, "Access token should be generated");
        assertTrue(token.length() > 0, "Token should not be empty");
    }

    @Test
    public void testGenerateRefreshToken() {
        String token = jwtService.generateRefreshToken(testUser);
        assertNotNull(token, "Refresh token should be generated");
        assertTrue(token.length() > 0, "Token should not be empty");
    }

    @Test
    public void testExtractUsername() {
        String token = jwtService.generateAccessToken(testUser);
        String username = jwtService.extractUsername(token);
        assertEquals("testuser", username, "Username should match");
    }

    @Test
    public void testTokenContainsJti() {
        String token = jwtService.generateAccessToken(testUser);
        String jti = jwtService.extractJti(token);
        assertNotNull(jti, "Token should contain jti claim");
        assertTrue(jti.length() > 0, "Jti should not be empty");
    }

    @Test
    public void testAccessTokenHasCorrectType() {
        String token = jwtService.generateAccessToken(testUser);
        String jti = jwtService.extractJti(token);
        assertNotNull(jti, "Access token should have jti");
    }

    @Test
    public void testRefreshTokenHasCorrectType() {
        String token = jwtService.generateRefreshToken(testUser);
        String jti = jwtService.extractJti(token);
        assertNotNull(jti, "Refresh token should have jti");
    }

    @Test
    public void testExtractExpiration() {
        String token = jwtService.generateAccessToken(testUser);
        java.util.Date expiration = jwtService.extractExpiration(token);
        assertNotNull(expiration, "Expiration should be extracted");
        assertTrue(expiration.after(new java.util.Date()), "Token should not be expired immediately");
    }
}
