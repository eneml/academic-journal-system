package com.eneml.ajs.editorial.internal.web.dto;

public record DecisionEmailRecipient(
        Long userId,
        String email,
        String fullName,
        String locale,
        String role) {
}
