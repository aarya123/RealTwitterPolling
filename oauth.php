<?php
    $CONSUMER_KEY = "cjcr0YpkTnPreVobBkQ";
    $CONSUMER_SECRET = "s9OFkPoL3FaU604fBhyekPsOxxmJaFMKKlMgAiCagZ4";
    $ACCESS_TOKEN = "1155418735-qJPDBUj2PeXSiYr4jHRPL5k63zsknbmNeABZilQ";
    $ACCESS_TOKEN_SECRET = "JGxVoxi1uPFCbtYSasPpexqepp4tmPShOrEvcPUyvImxP";
    ini_set('display_errors', 1);
    require_once('TwitterAPIExchange.php');
    
    /** Set access tokens here - see: https://dev.twitter.com/apps/ **/
    $settings = array(
        'oauth_access_token' => $ACCESS_TOKEN,
        'oauth_access_token_secret' => $ACCESS_TOKEN_SECRET,
        'consumer_key' => $CONSUMER_KEY,
        'consumer_secret' => $CONSUMER_SECRET
    );
    
    /** URL for REST request, see: https://dev.twitter.com/docs/api/1.1/ **/
    $url = 'https://api.twitter.com/1.1/blocks/create.json';
    $requestMethod = 'POST';
    
    /** POST fields required by the URL above. See relevant docs as above **/
    /*
    $postfields = array(
        'screen_name' => 'usernameToBlock', 
        'skip_status' => '1'
    );
    */
    /** Perform a POST request and echo the response **/
    /*
    $twitter = new TwitterAPIExchange($settings);
    echo $twitter->buildOauth($url, $requestMethod)
                 ->setPostfields($postfields)
                 ->performRequest();
                 */
    
    /** Perform a GET request and echo the response **/
    /** Note: Set the GET field BEFORE calling buildOauth(); **/
    $url = 'https://api.twitter.com/1.1/followers/ids.json';
    $getfield = '?screen_name=J7mbo';
    $requestMethod = 'GET';
    $twitter = new TwitterAPIExchange($settings);
    echo $twitter->setGetfield($getfield)
                 ->buildOauth($url, $requestMethod)
                 ->performRequest();
?>