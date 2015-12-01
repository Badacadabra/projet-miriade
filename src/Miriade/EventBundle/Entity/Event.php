<?php

namespace Miriade\EventBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;

/**
 * Event
 *
 * @ORM\Table()
 * @ORM\Entity(repositoryClass="Miriade\EventBundle\Entity\EventRepository")
 */
class Event
{
    /**
     * @var integer
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @var string
     *
     * @ORM\Column(name="title", type="string", length=255)
     */
    private $title;

    /**
     * @var \DateTime
     *
     * @ORM\Column(name="startDate", type="datetime")
     */
    private $startDate;

    /**
     * @var \DateTime
     *
     * @ORM\Column(name="endDate", type="datetime")
     */
    private $endDate;

    /**
     * @var string
     *
     * @ORM\Column(name="locate", type="string", length=255)
     */
    private $adress;

    /**
     * @var string
     *
     * @ORM\Column(name="city", type="string", length=255)
     */
    private $city;

    /**
     * @var string
     *
     * @ORM\Column(name="cp", type="integer", length=5)
     */
    private $cp;

    /**
     * @var string
     *
     * @ORM\Column(name="image", type="string", length=255, nullable=true)
     */
    private $image;

    /**
     * @var string
     *
     * @ORM\Column(name="description", type="text")
     */
    private $description;

    /**
     * @ORM\ManyToOne(targetEntity="Miriade\EventBundle\Entity\Partner", cascade={"persist"})
     * @ORM\JoinColumn(nullable=false)
     */
    private $partner;

    /**
     * @ORM\ManyToOne(targetEntity="Miriade\EventBundle\Entity\Session", cascade={"persist"})
     * @ORM\JoinColumn(nullable=false)
     **/
    private $session;

    /**
     * @var integer
     * @ORM\Column(name="nbTable", type="integer")
     */
    private $nbTable;

    /**
     * @var integer
     * @ORM\Column(name="rdv", type="integer")
     */
    private $rdv;

    //~ public function __construct()
    //~ {
        //~ //$this->session = new ArrayCollection();
        //~ $this->startDate = new
    //~ }

    /**
     * Get id
     *
     * @return integer 
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set title
     *
     * @param string $title
     * @return Event
     */
    public function setTitle($title)
    {
        $this->title = $title;

        return $this;
    }

    /**
     * Get title
     *
     * @return string 
     */
    public function getTitle()
    {
        return $this->title;
    }

    /**
     * Set startDate
     *
     * @param \DateTime $startDate
     * @return Event
     */
    public function setStartDate($startDate)
    {
        $this->startDate = new \DateTime($startDate);

        return $this;
    }

    /**
     * Get startDate
     *
     * @return \DateTime 
     */
    public function getStartDate()
    {
        return $this->startDate;
    }

    /**
     * Set endDate
     *
     * @param \DateTime $endDate
     * @return Event
     */
    public function setEndDate($endDate)
    {
        $this->endDate = new \DateTime($endDate);

        return $this;
    }

    /**
     * Get endDate
     *
     * @return \DateTime 
     */
    public function getEndDate()
    {
        return $this->endDate;
    }

    /**
     * Set locate
     *
     * @param string $locate
     * @return Event
     */
    public function setLocate($locate)
    {
        $this->locate = $locate;

        return $this;
    }

    /**
     * Get locate
     *
     * @return string 
     */
    public function getLocate()
    {
        return $this->locate;
    }

    /**
     * Set image
     *
     * @param string $image
     * @return Event
     */
    public function setImage($image)
    {
        $this->image = $image;

        return $this;
    }

    /**
     * Get image
     *
     * @return string 
     */
    public function getImage()
    {
        return $this->image;
    }

    /**
     * Set description
     *
     * @param string $description
     * @return Event
     */
    public function setDescription($description)
    {
        $this->description = $description;

        return $this;
    }

    /**
     * Get description
     *
     * @return string 
     */
    public function getDescription()
    {
        return $this->description;
    }

    /**
     * Set partner
     *
     * @param \Miriade\EventBundle\Entity\Partner $partner
     * @return Event
     */
    public function setPartner(\Miriade\EventBundle\Entity\Partner $partner)
    {
        $this->partner = $partner;

        return $this;
    }

    /**
     * Get partner
     *
     * @return \Miriade\EventBundle\Entity\Partner 
     **/
    public function getPartner()
    {
        return $this->partner;
    }

    /**
     * Set session
     *
     * @param \Miriade\EventBundle\Entity\Session $session
     * @return Event
     */
    public function setSession(\Miriade\EventBundle\Entity\Session $session)
    {
        $this->session = $session;

        return $this;
    }

    /**
     * Get session
     *
     * @return \Miriade\EventBundle\Entity\Session 
     **/
    public function getSession()
    {
        return $this->session;
    }

    /**
     * Set adress
     *
     * @param string $adress
     * @return Event
     */
    public function setAdress($adress)
    {
        $this->adress = $adress;

        return $this;
    }

    /**
     * Get adress
     *
     * @return string 
     */
    public function getAdress()
    {
        return $this->adress;
    }

    /**
     * Set city
     *
     * @param string $city
     * @return Event
     */
    public function setCity($city)
    {
        $this->city = $city;

        return $this;
    }

    /**
     * Get city
     *
     * @return string 
     */
    public function getCity()
    {
        return $this->city;
    }

    /**
     * Set cp
     *
     * @param integer $cp
     * @return Event
     */
    public function setCp($cp)
    {
        $this->cp = $cp;

        return $this;
    }

    /**
     * Get cp
     *
     * @return integer 
     */
    public function getCp()
    {
        return $this->cp;
    }

    /**
     * Set nbTable
     *
     * @param integer $nbTable
     * @return Event
     */
    public function setNbTable($nbTable)
    {
        $this->nbTable = $nbTable;

        return $this;
    }

    /**
     * Get nbTable
     *
     * @return integer 
     */
    public function getNbTable()
    {
        return $this->nbTable;
    }

    /**
     * Set rdv
     *
     * @param integer $rdv
     * @return Event
     */
    public function setRdv($rdv)
    {
        $this->rdv = $rdv;

        return $this;
    }

    /**
     * Get rdv
     *
     * @return integer 
     */
    public function getRdv()
    {
        return $this->rdv;
    }
    /**
     * Permet d'enregistrer l'image de l'événement
     * @param $image : l'image à enrégistrer
     * */
    public function uploadImage($image)
    {
		$realName = $image['name']['image'];
	    $ext = pathinfo($realName, PATHINFO_EXTENSION);
	    $tmp_name = $image['tmp_name']['image'];
	    $name = sha1(uniqid(mt_rand(), true)).'.'.$ext;
	    if(move_uploaded_file($tmp_name,__DIR__."/../../../../web/upload/images/".$name)) {
			$this->image = $name;
			return true;
		} else
			return false;
	}
}
