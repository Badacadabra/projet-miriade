<?php

namespace Miriade\UserBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class DefaultController extends Controller
{
    public function indexAction($name)
    {
        return $this->render('MiriadeUserBundle:Default:index.html.twig', array('name' => $name));
    }
}
