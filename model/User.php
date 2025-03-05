<?php

class User {
    private $id;
    private $name;
    private $type;
    private $created_at;
    private $login;
    private $pass;

    public function __construct($id = 0, $name = "", $type = "standard", $created_at = null, $login = "", $pass = "") {
        $this->id = $id;
        $this->name = $name;
        $this->type = $type;
        $this->created_at = $created_at ?? date('Y-m-d H:i:s'); // Data atual por padrão
        $this->login = $login;
        $this->pass = $pass;
    }

    public function getId() {
        return $this->id;
    }

    public function getName() {
        return $this->name;
    }

    public function getType() {
        return $this->type;
    }

    public function getCreatedAt() {
        return $this->created_at;
    }

    public function getLogin() {
        return $this->login;
    }

    public function getPass() {
        return $this->pass;
    }

    public function setId($id) {
        $this->id = $id;
    }

    public function setName($name) {
        $this->name = $name;
    }

    public function setType($type) {
        $this->type = $type;
    }

    public function setCreatedAt($created_at) {
        $this->created_at = $created_at;
    }

    public function setLogin($login) {
        $this->login = $login;
    }

    public function setPass($pass) {
        $this->pass = $pass;
    }
}
