package com.study11408;

import com.study11408.service.AiClientService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit test for {@link AiClientService} — guards against P0-06
 * (RestTemplate without timeout configuration causes backend worker
 * threads to block indefinitely when the AI service hangs, exhausting
 * the thread pool and triggering a cascading outage).
 *
 * <p>The fix uses {@link RestTemplateBuilder} to set explicit
 * connectTimeout and readTimeout on the underlying request factory.
 * This test verifies the constructor wires those timeouts; the actual
 * fail-fast behaviour under a hung peer is validated by E2E.
 */
class AiClientServiceUnitTest {

    @Test
    void constructor_should_build_resttemplate_without_throwing() {
        AiClientService service = new AiClientService(
                "http://localhost:8000",
                new RestTemplateBuilder(),
                5000,
                120000);

        assertThat(service).isNotNull();
        RestTemplate rt = extractRestTemplate(service);
        assertThat(rt).isNotNull();
        assertThat(rt.getRequestFactory())
                .as("RestTemplate must have a request factory")
                .isNotNull();
    }

    @Test
    void resttemplate_should_have_request_factory_with_configured_timeouts() throws Exception {
        int connectMs = 5000;
        int readMs = 120000;

        AiClientService service = new AiClientService(
                "http://localhost:8000",
                new RestTemplateBuilder(),
                connectMs,
                readMs);

        ClientHttpRequestFactory factory = extractRestTemplate(service).getRequestFactory();
        TimeoutValues actual = readTimeouts(factory);
        assertThat(actual.connectMs)
                .as("connectTimeout must be wired through the builder (factory=%s)",
                        factory.getClass().getName())
                .isEqualTo(connectMs);
        assertThat(actual.readMs)
                .as("readTimeout must be wired through the builder (factory=%s)",
                        factory.getClass().getName())
                .isEqualTo(readMs);
    }

    @Test
    void custom_timeout_values_should_propagate_to_request_factory() throws Exception {
        int connectMs = 1234;
        int readMs = 56789;

        AiClientService service = new AiClientService(
                "http://localhost:8000",
                new RestTemplateBuilder(),
                connectMs,
                readMs);

        ClientHttpRequestFactory factory = extractRestTemplate(service).getRequestFactory();
        TimeoutValues actual = readTimeouts(factory);
        assertThat(actual.connectMs).isEqualTo(connectMs);
        assertThat(actual.readMs).isEqualTo(readMs);
    }

    private static RestTemplate extractRestTemplate(AiClientService service) {
        try {
            Field f = AiClientService.class.getDeclaredField("restTemplate");
            f.setAccessible(true);
            return (RestTemplate) f.get(service);
        } catch (ReflectiveOperationException e) {
            throw new AssertionError(e);
        }
    }

    /**
     * Pull connect/read timeouts from the factory, regardless of which
     * backend Spring Boot picked.
     *
     * <p>Strategy:
     * <ol>
     *   <li>Look at the factory itself for primitive/Duration fields named
     *       like {@code connectTimeout} or {@code readTimeout} — covers
     *       SimpleClientHttpRequestFactory / HttpComponentsClientHttpRequestFactory.</li>
     *   <li>Look one level into a delegate field (named {@code client},
     *       {@code requestFactory}, or {@code delegate}) for either the
     *       same primitive fields or for getter methods like
     *       {@code connectTimeoutMillis()} / {@code readTimeoutMillis()} —
     *       covers OkHttp3ClientHttpRequestFactory (Spring Boot 3.2 default
     *       when okhttp is on the classpath) and JdkClientHttpRequestFactory.</li>
     * </ol>
     */
    private static TimeoutValues readTimeouts(Object factory) throws Exception {
        TimeoutValues v = new TimeoutValues();
        scanInstanceFieldsForTimeouts(factory, v);

        if (v.connectMs == null || v.readMs == null) {
            for (String delegateName : new String[]{"client", "requestFactory", "delegate"}) {
                Object delegate = readDeclaredFieldIfExists(factory, delegateName);
                if (delegate == null) continue;
                scanInstanceFieldsForTimeouts(delegate, v);
                tryGetterMethods(delegate, v);
                if (v.connectMs != null && v.readMs != null) break;
            }
        }

        if (v.connectMs == null || v.readMs == null) {
            throw new AssertionError("Could not locate connect/read timeout values on "
                    + factory.getClass().getName()
                    + " (found connect=" + v.connectMs + ", read=" + v.readMs + ")");
        }
        return v;
    }

    private static void scanInstanceFieldsForTimeouts(Object target, TimeoutValues v) throws Exception {
        Class<?> cls = target.getClass();
        while (cls != null && cls != Object.class) {
            for (Field f : cls.getDeclaredFields()) {
                if (Modifier.isStatic(f.getModifiers())) continue;
                String n = f.getName().toLowerCase();
                Class<?> t = f.getType();
                if (!t.isPrimitive() && t != java.time.Duration.class) continue;
                f.setAccessible(true);
                Object value = f.get(target);
                Long ms = asMillis(value);
                if (ms == null) continue;
                if (n.contains("connecttimeout") && v.connectMs == null) v.connectMs = ms.intValue();
                else if (n.contains("readtimeout") && v.readMs == null) v.readMs = ms.intValue();
            }
            cls = cls.getSuperclass();
        }
    }

    private static void tryGetterMethods(Object target, TimeoutValues v) {
        if (v.connectMs == null) v.connectMs = invokeIntGetter(target, "connectTimeoutMillis");
        if (v.readMs == null) v.readMs = invokeIntGetter(target, "readTimeoutMillis");
    }

    private static Integer invokeIntGetter(Object target, String name) {
        Class<?> cls = target.getClass();
        while (cls != null && cls != Object.class) {
            try {
                Method m = cls.getDeclaredMethod(name);
                if (Modifier.isStatic(m.getModifiers())) return null;
                m.setAccessible(true);
                Object r = m.invoke(target);
                if (r instanceof Integer) return (Integer) r;
                if (r instanceof Long) return ((Long) r).intValue();
                if (r instanceof java.time.Duration) return (int) ((java.time.Duration) r).toMillis();
                return null;
            } catch (NoSuchMethodException e) {
                cls = cls.getSuperclass();
            } catch (ReflectiveOperationException e) {
                return null;
            }
        }
        return null;
    }

    private static Object readDeclaredFieldIfExists(Object target, String name) {
        Class<?> cls = target.getClass();
        while (cls != null && cls != Object.class) {
            try {
                Field f = cls.getDeclaredField(name);
                if (Modifier.isStatic(f.getModifiers())) return null;
                f.setAccessible(true);
                return f.get(target);
            } catch (NoSuchFieldException e) {
                cls = cls.getSuperclass();
            } catch (ReflectiveOperationException e) {
                return null;
            }
        }
        return null;
    }

    private static Long asMillis(Object v) {
        if (v == null) return null;
        if (v instanceof Integer) return ((Integer) v).longValue();
        if (v instanceof Long) return (Long) v;
        if (v instanceof java.time.Duration) return ((java.time.Duration) v).toMillis();
        return null;
    }

    private static class TimeoutValues {
        Integer connectMs;
        Integer readMs;
    }
}
