package com.studybuddy.course;

import com.studybuddy.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface CourseRepository extends JpaRepository<Course, Integer> {
    
    Optional<Course> findByCourseCode(String code);
    
    Set<Course> findByCourseCodeIn(Set<String> codes);
}
