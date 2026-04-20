package com.study11408.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(String message) {
        super(message);
        this.code = HttpStatus.BAD_REQUEST.value();
    }

    public BusinessException(String message, int code) {
        super(message);
        this.code = code;
    }

    public BusinessException(String message, HttpStatus status) {
        super(message);
        this.code = status.value();
    }
}
