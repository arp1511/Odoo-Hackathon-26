package com.transitops.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles ResponseStatusException — the primary business logic exception type.
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        return buildResponse(ex.getStatusCode().value(), ex.getReason());
    }

    /**
     * Handle Spring Security AccessDeniedException with 403.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return buildResponse(HttpStatus.FORBIDDEN.value(), "Access denied: insufficient permissions");
    }

    /**
     * Handle authentication exceptions with 401.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthentication(AuthenticationException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED.value(), "Authentication required");
    }

    /**
     * Handles database constraint violations — returns 409 instead of raw 500.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        String message = "Data integrity violation";
        String detail = ex.getMostSpecificCause().getMessage();
        if (detail != null) {
            if (detail.contains("registration_number")) {
                message = "Registration number already exists";
            } else if (detail.contains("license_number")) {
                message = "License number already exists";
            } else if (detail.contains("email")) {
                message = "Email already registered";
            }
        }
        return buildResponse(HttpStatus.CONFLICT.value(), message);
    }

    /**
     * Handles bean validation failures (@Valid on request body) — returns 400.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return buildResponse(HttpStatus.BAD_REQUEST.value(), "Validation failed: " + errors);
    }

    /**
     * Handles JSON parsing errors (invalid enum values, malformed JSON) — returns 400.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleMessageNotReadable(HttpMessageNotReadableException ex) {
        String message = "Invalid request body";
        if (ex.getMessage() != null && ex.getMessage().contains("not one of the values accepted")) {
            message = "Invalid enum value in request";
        }
        return buildResponse(HttpStatus.BAD_REQUEST.value(), message);
    }

    /**
     * Catch-all handler — returns 500 with sanitized message (no raw stack traces).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        System.err.println("[ERROR] Unhandled exception: " + ex.getClass().getName() + ": " + ex.getMessage());
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "An internal error occurred. Please try again.");
    }

    private ResponseEntity<Map<String, Object>> buildResponse(int status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", status);
        body.put("message", message != null ? message : "Error");
        body.put("timestamp", Instant.now().toString());
        return ResponseEntity.status(status).body(body);
    }
}
