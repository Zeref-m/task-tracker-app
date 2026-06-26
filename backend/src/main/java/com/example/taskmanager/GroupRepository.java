package com.example.taskmanager;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {

    @Query("SELECT g FROM Group g WHERE LOWER(g.groupName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Group> searchByName(String query);
}
