package backend.WF.security;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class PasswordStrengthValidatorTest {

    @Autowired
    private Validator validator;

    private TestPasswordRequest testRequest;

    @BeforeEach
    public void setUp() {
        testRequest = new TestPasswordRequest();
    }

    @Test
    public void testStrongPasswordIsValid() {
        testRequest.password = "StrongPass123!";
        Set<ConstraintViolation<TestPasswordRequest>> violations = validator.validate(testRequest);
        assertTrue(violations.isEmpty(), "Strong password should be valid");
    }

    @Test
    public void testPasswordTooShort() {
        testRequest.password = "Short1!";
        Set<ConstraintViolation<TestPasswordRequest>> violations = validator.validate(testRequest);
        assertFalse(violations.isEmpty(), "Password shorter than 12 chars should be invalid");
    }

    @Test
    public void testPasswordMissingUppercase() {
        testRequest.password = "lowercase123!";
        Set<ConstraintViolation<TestPasswordRequest>> violations = validator.validate(testRequest);
        assertFalse(violations.isEmpty(), "Password without uppercase should be invalid");
    }

    @Test
    public void testPasswordMissingLowercase() {
        testRequest.password = "UPPERCASE123!";
        Set<ConstraintViolation<TestPasswordRequest>> violations = validator.validate(testRequest);
        assertFalse(violations.isEmpty(), "Password without lowercase should be invalid");
    }

    @Test
    public void testPasswordMissingDigit() {
        testRequest.password = "NoDigits!@#";
        Set<ConstraintViolation<TestPasswordRequest>> violations = validator.validate(testRequest);
        assertFalse(violations.isEmpty(), "Password without digit should be invalid");
    }

    @Test
    public void testPasswordMissingSpecialChar() {
        testRequest.password = "NoSpecial123";
        Set<ConstraintViolation<TestPasswordRequest>> violations = validator.validate(testRequest);
        assertFalse(violations.isEmpty(), "Password without special char should be invalid");
    }

    @Test
    public void testComplexStrongPassword() {
        testRequest.password = "MyP@ssw0rd!Secure#2024";
        Set<ConstraintViolation<TestPasswordRequest>> violations = validator.validate(testRequest);
        assertTrue(violations.isEmpty(), "Complex password should be valid");
    }

    @Test
    public void testNullPassword() {
        testRequest.password = null;
        Set<ConstraintViolation<TestPasswordRequest>> violations = validator.validate(testRequest);
        assertFalse(violations.isEmpty(), "Null password should be invalid");
    }

    @Test
    public void testEmptyPassword() {
        testRequest.password = "";
        Set<ConstraintViolation<TestPasswordRequest>> violations = validator.validate(testRequest);
        assertFalse(violations.isEmpty(), "Empty password should be invalid");
    }

    // Inner test class for validation testing
    public static class TestPasswordRequest {
        @PasswordStrength
        public String password;
    }
}
