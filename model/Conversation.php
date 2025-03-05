<?php

class Conversation {
    private $id;
    private $user1_id;
    private $user2_id;
    private $created_at;

    public function __construct($id = null, $user1_id = 0, $user2_id = 0, $created_at = null) {
        $this->id = $id;
        $this->user1_id = $user1_id;
        $this->user2_id = $user2_id;
        $this->created_at = $created_at ?? date('Y-m-d H:i:s'); // Data atual por padrão
    }

    public function getId() {
        return $this->id;
    }

    public function getUser1Id() {
        return $this->user1_id;
    }

    public function getUser2Id() {
        return $this->user2_id;
    }

    public function getCreatedAt() {
        return $this->created_at;
    }

    public function setId($id) {
        $this->id = $id;
    }

    public function setUser1Id($user1_id) {
        $this->user1_id = $user1_id;
    }

    public function setUser2Id($user2_id) {
        $this->user2_id = $user2_id;
    }

    public function setCreatedAt($created_at) {
        $this->created_at = $created_at;
    }
}