package com.transitops.controller;

import com.transitops.dto.AuthResponse;
import com.transitops.dto.LoginRequest;
import com.transitops.dto.RegisterRequest;
import com.transitops.dto.UserDto;
import com.transitops.entity.User;
import com.transitops.repository.UserRepository;
import com.transitops.security.JwtUtil;
import com.transitops.entity.PasswordResetToken;
import com.transitops.repository.PasswordResetTokenRepository;
import com.transitops.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import java.util.UUID;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    private static final List<String> VALID_ROLES = List.of("FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST");

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (!VALID_ROLES.contains(request.getRole())) {
            return ResponseEntity.badRequest().body("Invalid role");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setStatus("ACTIVE");

        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
        }
        
        User user = optionalUser.get();
        
        if ("INACTIVE".equals(user.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("User account is inactive");
        }
        
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(java.time.Instant.now())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials. Account locked after 5 failed attempts.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (Exception e) {
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() == null ? 1 : user.getFailedLoginAttempts() + 1);
            if (user.getFailedLoginAttempts() >= 5) {
                user.setLockedUntil(java.time.Instant.now().plus(java.time.Duration.ofMinutes(15)));
                userRepository.save(user);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials. Account locked after 5 failed attempts.");
            }
            userRepository.save(user);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
        }

        // Reset on success
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getId().toString());

        return ResponseEntity.ok(new AuthResponse(token, user.getId().toString(), user.getRole(), user.getName()));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getName();
        Optional<User> userOptional = userRepository.findByEmail(email);

        return userOptional.map(user -> ResponseEntity.ok(new UserDto(user)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody java.util.Map<String, String> request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getName();
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (request.containsKey("name") && !request.get("name").isBlank()) {
                user.setName(request.get("name"));
                userRepository.save(user);
                return ResponseEntity.ok(new UserDto(user));
            }
            return ResponseEntity.badRequest().body("Name is required");
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String token = UUID.randomUUID().toString();
            PasswordResetToken prt = new PasswordResetToken();
            prt.setToken(token);
            prt.setUser(user);
            prt.setExpiryDate(LocalDateTime.now().plusMinutes(15));
            passwordResetTokenRepository.save(prt);

            emailService.sendPasswordResetEmail(user.getEmail(), token);
        }
        // Always return success to prevent email enumeration
        return ResponseEntity.ok("If that email is in our system, we have sent a reset link.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody java.util.Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("password");

        Optional<PasswordResetToken> prtOpt = passwordResetTokenRepository.findByToken(token);
        if (prtOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid or expired token");
        }

        PasswordResetToken prt = prtOpt.get();
        if (prt.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Token has expired");
        }

        User user = prt.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        // Delete token after use
        passwordResetTokenRepository.delete(prt);

        return ResponseEntity.ok("Password successfully reset");
    }
}
