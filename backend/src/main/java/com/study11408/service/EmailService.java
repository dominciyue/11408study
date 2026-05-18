package com.study11408.service;

import com.study11408.exception.BusinessException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:}")
    private String from;

    @Value("${app.mail.from-name:11408 学习平台}")
    private String fromName;

    public void sendVerificationCode(String to, String code) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
            h.setFrom(new InternetAddress(from, fromName, "UTF-8"));
            h.setTo(to);
            h.setSubject("【11408 学习平台】注册验证码");
            h.setText(
                "<p>您的验证码是:<b style=\"font-size:18px\">" + code + "</b></p>" +
                "<p>5 分钟内有效。如非本人操作请忽略。</p>",
                true);
            mailSender.send(msg);
            log.info("verification code sent to {}", to);
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("failed to send verification code to {}", to, e);
            throw new BusinessException("邮件发送失败,请稍后重试", HttpStatus.BAD_GATEWAY);
        }
    }
}
