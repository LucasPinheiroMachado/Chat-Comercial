<?php

class Message {
    private $id;
    private $message;
    private $user_id;
    private $conversation_id;
    private $created_at;

    public function __construct($id = 0, $message = "", $user_id = 0, $conversation_id = 0, $created_at = null) {
        $this->id = $id;
        $this->message = $message;
        $this->user_id = $user_id;
        $this->conversation_id = $conversation_id;
        $this->created_at = $created_at ?? date('Y-m-d H:i:s'); // Data atual por padrão
    }

    public function getId() {
        return $this->id;
    }

    public function getMessage() {
        return $this->message;
    }

    public function getUserId() {
        return $this->user_id;
    }

    public function getConversationId() {
        return $this->conversation_id;
    }

    public function getCreatedAt() {
        return $this->created_at;
    }

    public function setId($id) {
        $this->id = $id;
    }

    public function setMessage($message) {
        $this->message = $message;
    }

    public function setUserId($user_id) {
        $this->user_id = $user_id;
    }

    public function setConversationId($conversation_id) {
        $this->conversation_id = $conversation_id;
    }

    public function setCreatedAt($created_at) {
        $this->created_at = $created_at;
    }
}