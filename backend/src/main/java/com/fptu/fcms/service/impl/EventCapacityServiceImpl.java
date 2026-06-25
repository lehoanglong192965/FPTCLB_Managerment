package com.fptu.fcms.service.impl;

import com.fptu.fcms.service.EventCapacityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EventCapacityServiceImpl implements EventCapacityService {

    private static final String KEY_PREFIX = "event:capacity:";

    private final StringRedisTemplate redisTemplate;

    @Override
    public boolean reserveSeat(Integer eventId, Integer maxParticipants) {
        if (eventId == null || maxParticipants == null || maxParticipants <= 0) {
            return true;
        }
        String key = key(eventId);
        String script = """
                local current = redis.call('GET', KEYS[1])
                if not current then
                    redis.call('SET', KEYS[1], ARGV[1])
                    current = ARGV[1]
                end
                current = tonumber(current)
                if current <= 0 then
                    return 0
                end
                redis.call('DECR', KEYS[1])
                return 1
                """;
        Long result = redisTemplate.execute(
                new DefaultRedisScript<>(script, Long.class),
                List.of(key),
                String.valueOf(maxParticipants)
        );
        return Long.valueOf(1L).equals(result);
    }

    @Override
    public void releaseSeat(Integer eventId) {
        if (eventId == null) return;
        redisTemplate.opsForValue().increment(key(eventId));
    }

    @Override
    public void resetCapacity(Integer eventId, Integer maxParticipants) {
        if (eventId == null || maxParticipants == null || maxParticipants <= 0) return;
        redisTemplate.opsForValue().set(key(eventId), String.valueOf(maxParticipants));
    }

    private String key(Integer eventId) {
        return KEY_PREFIX + eventId;
    }
}
