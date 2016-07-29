/**
 * Author: Rosy Yang <rosy.yang@gmail.com>
 */
package com.innosics.auth;

import java.util.ArrayList;
import java.util.List;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.innosics.config.Constance;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.MongoClient;

public class MongoUserDetailsService implements InitializingBean, UserDetailsService {

	final static Logger logger = Logger.getLogger(MongoUserDetailsService.class);
	
	private MongoClient mongoClient;
	
	public MongoUserDetailsService() throws Exception {
		mongoClient = new MongoClient( "localhost" , 27017 );
	}
	
	@Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
		
		DB db = mongoClient.getDB(Constance.ACCOUNT_DB_NAME);
		DBCollection coll = db.getCollection("users");
		
		BasicDBObject query = new BasicDBObject("email", email)
			.append("accountNonExpired", true)
			.append("credentialsNonExpired", true)
			.append("accountNonLocked", true)
			.append("enabled", true)
		;
		
	    BasicDBObject u = (BasicDBObject) coll.findOne(query);
		
		if (u != null){
			u.put("_id", u.getString("_id"));
		}
				
		MongoUserDetails userDetails = new MongoUserDetails();
		userDetails.setUsername(u.getString("email"));
		userDetails.setPassword(u.getString("password"));
    	
		BasicDBList authorities = (BasicDBList) u.get("authorities");
    	List<GrantedAuthority> auths = new ArrayList<GrantedAuthority>();
    	for (int i = 0; i < authorities.size(); i ++){
    		String auth = (String)authorities.get(i);
    		auths.add(new SimpleGrantedAuthority(auth));
    	}
    	userDetails.setAuthorities(auths);
    	
        return userDetails;
    }

	@Override
	public void afterPropertiesSet() throws Exception {
		// TODO Auto-generated method stub
	}
}
