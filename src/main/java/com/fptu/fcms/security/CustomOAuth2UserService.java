package com.fptu.fcms.security;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        // Retrieve email attribute
        String email = oAuth2User.getAttribute("email");
        
        // Custom check or logging. 
        // As requested by the user, we allow ANY Google email account (e.g. @gmail.com) to login successfully.
        System.out.println("Authenticated OAuth2 User: " + email);
        
        return oAuth2User;
    }
}
