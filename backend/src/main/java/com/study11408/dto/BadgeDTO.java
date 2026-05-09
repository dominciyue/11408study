package com.study11408.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BadgeDTO {
    /** 稳定 code，前端做条件渲染／展示用。 */
    private String code;
    private String name;
    private String description;
    /** UTF-8 emoji 即可，前端不再去映射图标资源。 */
    private String icon;
    /** 是否已解锁。 */
    private Boolean earned;
    /** 当前进度数值（用于"未解锁"的进度条渲染）。 */
    private Long current;
    /** 解锁阈值。 */
    private Long target;
}
