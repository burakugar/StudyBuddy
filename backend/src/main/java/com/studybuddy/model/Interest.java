package com.studybuddy.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Entity
@Table(name = "interests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Interest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false)
    private String name;

    @OneToMany(mappedBy = "interest", cascade = CascadeType.PERSIST, fetch = FetchType.LAZY)
    private Set<UserInterest> users = new HashSet<>();

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        Interest interest = (Interest) o;
        return Objects.equals(id, interest.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Interest{" +
            "id=" + id +
            ", name='" + name + '\'' +
            '}';
    }
}
