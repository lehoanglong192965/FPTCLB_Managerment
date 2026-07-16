package com.fptu.fcms.repository;

import com.fptu.fcms.entity.Event;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class RepositoryContractTest {

    @Test
    void eventConflictLookupReturnsTypedEventOptional() throws Exception {
        Method method = EventRepository.class.getMethod(
                "findFirstByLocationAndEventIDNotAndEventStatusAndStartDateBeforeAndEndDateAfterAndIsDeletedFalse",
                String.class,
                Integer.class,
                com.fptu.fcms.enums.EventStatus.class,
                java.time.LocalDateTime.class,
                java.time.LocalDateTime.class
        );

        assertEquals(Optional.class, method.getReturnType());
        assertEquals("java.util.Optional<com.fptu.fcms.entity.Event>", method.getGenericReturnType().getTypeName());
    }

    @Test
    void groupedRegistrationQueriesHaveOnlyTheAnnotatedCollectionContract() {
        assertGroupedQueryContract(EventRegistrationRepository.class);
        assertGroupedQueryContract(GuestEventRegistrationRepository.class);
    }

    private void assertGroupedQueryContract(Class<?> repositoryType) {
        List<Method> methods = Arrays.stream(repositoryType.getDeclaredMethods())
                .filter(method -> method.getName().equals("countGroupedByEventIDs"))
                .toList();

        assertEquals(1, methods.size(), repositoryType.getSimpleName());
        Method method = methods.getFirst();
        assertEquals(List.class, method.getReturnType());
        assertEquals(Collection.class, method.getParameterTypes()[0]);
        assertEquals(Collection.class, method.getParameterTypes()[1]);
        assertNotNull(method.getAnnotation(Query.class));
    }
}