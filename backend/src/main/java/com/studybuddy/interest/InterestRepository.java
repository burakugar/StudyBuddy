package com.studybuddy.interest;

import com.studybuddy.model.Interest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface InterestRepository extends JpaRepository<Interest, Integer> {
    
    Optional<Interest> findByName(String name);
    
    Set<Interest> findByNameIn(Set<String> names);
}
