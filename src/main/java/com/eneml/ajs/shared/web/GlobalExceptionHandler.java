package com.eneml.ajs.shared.web;

import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Translates domain exceptions into RFC 7807 Problem Details. Spring Boot's
 * built-in handlers (with {@code spring.mvc.problemdetails.enabled=true}) cover
 * validation errors, missing parameters, etc. — only domain-specific cases
 * need custom mapping here.
 */
@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    ProblemDetail onNotFound(NotFoundException ex) {
        var pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("Not Found");
        return pd;
    }

    @ExceptionHandler(ConflictException.class)
    ProblemDetail onConflict(ConflictException ex) {
        var pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        pd.setTitle("Conflict");
        return pd;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail onIntegrityViolation(DataIntegrityViolationException ex) {
        var pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
                "Constraint violation");
        pd.setTitle("Conflict");
        return pd;
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    ProblemDetail onOptimisticLocking(OptimisticLockingFailureException ex) {
        var pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
                "The resource was modified concurrently. Reload and retry.");
        pd.setTitle("Conflict");
        return pd;
    }
}
