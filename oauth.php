<?php
//https://github.com/J7mbo/twitter-api-php
include 'TwitterAPIExchange.php';
$test=new OAuth();
echo $test->GetTweets(array()).'<br><br><br><br><br><br><br>';
class OAuth{
    
    public $twitter;
    
    public function __construct(){
        ini_set('display_errors', 1);
        $settings = array(
            'oauth_access_token' => "1155418735-qJPDBUj2PeXSiYr4jHRPL5k63zsknbmNeABZilQ",
            'oauth_access_token_secret' => "JGxVoxi1uPFCbtYSasPpexqepp4tmPShOrEvcPUyvImxP",
            'consumer_key' => "cjcr0YpkTnPreVobBkQ",
            'consumer_secret' => "s9OFkPoL3FaU604fBhyekPsOxxmJaFMKKlMgAiCagZ4"
        );
        $this->twitter = new TwitterAPIExchange($settings);
    }

    public function GetTweets($params)
    {
        $getfield='?screen_name=mgottein';
        return $this->twitter->setGetfield($getfield)->buildOauth('https://api.twitter.com/1.1/statuses/mentions_timeline.json', 'GET')->performRequest();
    }
    
    public function SendTweets($url, $params)
    {
        
        
    }
}
?>