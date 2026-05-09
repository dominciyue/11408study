package com.study11408.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {

    @NotBlank
    @Pattern(regexp = "^(user|assistant)$", message = "role 必须是 user 或 assistant")
    private String role;

    @NotBlank
    private String content;
}
