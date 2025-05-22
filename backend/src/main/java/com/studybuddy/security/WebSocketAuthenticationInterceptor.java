package com.studybuddy.security;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class WebSocketAuthenticationInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    public WebSocketAuthenticationInterceptor(JwtTokenProvider jwtTokenProvider, UserDetailsService userDetailsService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            log.info("Processing WebSocket CONNECT command");

            // Extract JWT token from Authorization header
            String authorizationHeader = accessor.getFirstNativeHeader("Authorization");
            log.debug("Authorization header: {}", authorizationHeader);

            if (StringUtils.hasText(authorizationHeader) && authorizationHeader.startsWith("Bearer ")) {
                String token = authorizationHeader.substring(7);

                try {
                    if (jwtTokenProvider.validateToken(token)) {
                        String username = jwtTokenProvider.getUsernameFromToken(token);
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                        // Create authentication token and set it in the security context
                        UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        accessor.setUser(authentication);

                        log.info("WebSocket authenticated for user: {}", username);
                    } else {
                        log.warn("Invalid JWT token in WebSocket connection");
                    }
                } catch (Exception e) {
                    log.error("Error authenticating WebSocket connection", e);
                }
            } else {
                log.warn("No JWT token found in WebSocket connection request");
            }
        }

        return message;
    }
}
