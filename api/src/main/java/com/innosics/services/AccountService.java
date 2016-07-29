/**
 * Author: Rosy Yang <rosy.yang@gmail.com>
 */
package com.innosics.services;

import java.net.PasswordAuthentication;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.util.UUID;

import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import org.apache.log4j.Logger;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.innosics.auth.MongoUserDetails;
import com.innosics.auth.MongoUserDetailsService;
import com.innosics.config.Constance;
import com.innosics.util.Utilities;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.MongoClient;
import com.paypal.api.openidconnect.Session;

@Service
public class AccountService {

	final static Logger logger = Logger.getLogger(APIService.class);
		
	private MongoClient mongoClient;
	
	@Autowired
	private JavaMailSenderImpl mailSender;
	
	public AccountService() throws Exception {
		mongoClient = new MongoClient( "localhost" , 27017 );
	}

	public BasicDBObject findUserByUsername(String username) throws UsernameNotFoundException {
		logger.debug("*****loadUserByUsername***username****" + username); 
		
		DB db = mongoClient.getDB(Constance.ACCOUNT_DB_NAME);
		DBCollection coll = db.getCollection("users");
		
		BasicDBObject query = new BasicDBObject();		
		BasicDBObject q1 = new BasicDBObject("username", username);
		BasicDBObject q2 = new BasicDBObject("email", username);
		BasicDBList or = new BasicDBList();
		or.add(q1);
		or.add(q2);
		query.append("$or", or);
		
	    logger.debug("******loadUserByUsername*******query*******" + query); 
	    BasicDBObject u = (BasicDBObject) coll.findOne(query);
		
		if (u != null){
			logger.debug("**loadUserByUsername _id*****u _id****" + u.getString("_id")); 
			u.put("_id", u.getString("_id"));
		}
			
        return u;
    }
    
	public BasicDBObject createUser(BasicDBObject u){
		logger.debug("******createUser*******" + u); 
		DB db = mongoClient.getDB(Constance.ACCOUNT_DB_NAME);
		DBCollection coll = db.getCollection("users");
		
		String msg = "";
		String _id = u.getString("_id");
		if (_id != null && (!_id.equals("empty"))&& (!_id.trim().equals(""))){
			msg = "_id found in posted object, is it existing?";
		}else{
			BasicDBObject query = new BasicDBObject("email", u.getString("email"));
			
		    logger.debug("******createUser*******query*******" + query); 
		    BasicDBObject existsObj = (BasicDBObject) coll.findOne(query);
		    
			if (existsObj != null){
				logger.debug("******createUser*******existsObj*******" + existsObj); 
				return Utilities.wrap(u, false, Constance.ERROR_USER_EXISTS, "User creation failed: " + msg); 
			}else{
				u.put("enabled", false);
				coll.insert(u);
				_id = u.getString("_id");
				logger.debug("******createUser insert u _id**************" + _id); 
				u.put("_id", _id);
				
				boolean emailSend = sendRegConfirmEmail(u);
				
				//if (emailSend){
					return (BasicDBObject) Utilities.wrap(u, true, "User created successfully"); 
				//}else{
				//	return (BasicDBObject) Utilities.wrap(u, false, "User created successfully"); 
				//}
			}
		}
		
		return Utilities.wrap(u, false, "User creation failed: " + msg); 
	}
	public BasicDBObject confirmUser(String _id, String password){
		BasicDBObject query = new BasicDBObject("_id", new ObjectId(_id));
		DB db = mongoClient.getDB(Constance.ACCOUNT_DB_NAME);
		DBCollection coll = db.getCollection("users");
		
	    logger.debug("*******confirmUser*******query*******" + query); 
	    BasicDBObject r = (BasicDBObject) coll.findOne(query);
		
		if (r != null && password.equals(r.getString("password"))){
			logger.debug("*******confirmUser _id*******r _id*******" + r.getString("_id")); 
			r.remove("_id");
			r.put("enabled", true);
			coll.update(query, r);
			r.put("_id", _id);
			logger.debug("*******confirmUser _id*******enabled successfully*******"); 
			return Utilities.wrap(r, true, "User enabled successfully");
		}
		logger.debug("*******confirmUser _id*******User not found*******"); 
		return Utilities.wrap(new BasicDBObject("_id", _id), false, "User not found");
	}
	public BasicDBObject updateUser(BasicDBObject u){
		logger.debug("******updateUser*******" + u); 
		DB db = mongoClient.getDB(Constance.ACCOUNT_DB_NAME);
		DBCollection coll = db.getCollection("users");
		BasicDBObject existsObj = null;
		BasicDBObject query = new BasicDBObject();
		
		String msg = "";
		String _id = u.getString("_id");
		if (_id != null && (!_id.equals("empty"))&& (!_id.trim().equals(""))){
			query.put("_id", new ObjectId(_id));
		    logger.debug("******updateUser*******query*******" + query); 
		    existsObj = (BasicDBObject) coll.findOne(query);
		    
			u.remove("_id");
			if (existsObj != null){
				coll.update(query, u);
				logger.debug("******updateUser update u _id**************" + _id); 
				u.put("_id", _id);
				
				return Utilities.wrap(u, true, "User update successfully");
			}else{
				msg = "object not found in db with _id " + _id;
			}
		}else{
			msg = "_id not found in posted object";
		}
		return Utilities.wrap(u, false, "User update failed: " + msg); 
	}
	public BasicDBObject requestResetPassword(String email, String origin, String action){
		BasicDBObject query = new BasicDBObject("email", email);
		DB db = mongoClient.getDB(Constance.ACCOUNT_DB_NAME);
		DBCollection coll = db.getCollection("users");
		
	    logger.debug("*******resetPassword*******query*******" + query); 
	    BasicDBObject r = (BasicDBObject) coll.findOne(query);
		
		if (r != null){
			logger.debug("*******requestResetPassword *******u*******"); 
			
			String guid = UUID.randomUUID().toString().replaceAll("-", "");
			
			r.put("pwdreset", guid);
			r.put("pwdresettime", new java.util.Date().getTime());
			coll.update(query, r);
			
			String url = "http://localhost:8080/api/reset/" + guid + "?origin=" + origin;
			
			sendReqResetEmail(r, url);
			
			return Utilities.wrap(new BasicDBObject("email", email), true, "User request reset successfully");
		}else{
			return Utilities.wrap(new BasicDBObject("email", email), false, "User request reset successfully");
		}
	}
	public BasicDBObject resetPassword(String pwdreset, String password){
		BasicDBObject query = new BasicDBObject("pwdreset", pwdreset);
		DB db = mongoClient.getDB(Constance.ACCOUNT_DB_NAME);
		DBCollection coll = db.getCollection("users");
		
	    logger.debug("*******resetPassword*******query*******" + query); 
	    BasicDBObject r = (BasicDBObject) coll.findOne(query);
	    long t = r.getLong("pwdresettime") + 60*60*24*1000;;
	    long ct = new java.util.Date().getTime();
	    if (ct < t ){
			logger.debug("*******confirmUser _id*******r _id*******" + r.getString("_id")); 
			r.remove("_id");
			r.put("password", password);
			
			coll.update(query, r);
			r.put("_id", r.getString("_id"));
			logger.debug("*******resetPassword _id*******successfully*******"); 
			return Utilities.wrap(r, true, "User reset successfully");
	    }
	    return Utilities.wrap(r, false, "Reset request expired");
	}
	private boolean sendRegConfirmEmail(BasicDBObject u){
		
		String from = "support@innosics.com";
		String subject = "iOnTask sign up";
		
		String htmlMsg = "Dear <b>" + u.getString("name") + "</b>,\n";
				
		htmlMsg += "<p>Thanks for signing up for iOnTask! To confirm your account, please click the link: ";
		htmlMsg += "<a href='http://localhost:8080/api/confirm/" + u.getString("_id") + "?origin=" + u.getString("origin") + "'>"
		+ "I confirm that it was me!</a>";
		
		htmlMsg += "<p>If you did not register at www.iOnTask.com, please do not click the link and ignore and delete this email.</p>";
		htmlMsg += "<p>Thank you!</p>";
		htmlMsg += "<p>iOnTask Team!</p>";
		
		try{
			return sendEmail(htmlMsg, u, from, subject);
		}catch(Exception e){
			logger.error(e.getMessage());
		}	
		return false;
	}
	private boolean sendReqResetEmail(BasicDBObject u, String url){
		
		String from = "support@innosics.com";
		String subject = "iOnTask sign up";
		
		String htmlMsg = "Dear <b>" + u.getString("name") + "</b>,\n";
				
		htmlMsg += "<p>You requested password reset for your iOnTask account, please click the link to reset your password: ";
		htmlMsg += "<a href='" + url + "'>"
		+ "I confirm I do want to reset password!</a>, the link will be valid for 24 hours!";
		
		htmlMsg += "<p>If you did not request for password reset at www.iOnTask.com, please do not click the link and ignore and delete this email.</p>";
		htmlMsg += "<p>Thank you!</p>";
		htmlMsg += "<p>iOnTask Team!</p>";
		
		try{
			return sendEmail(htmlMsg, u, from, subject);
		}catch(Exception e){
			logger.error(e.getMessage());
		}	
		return false;
	}
	private boolean sendEmail(String htmlMsg, BasicDBObject u, String from, String subject) throws MessagingException{
		MimeMessage mimeMessage = mailSender.createMimeMessage();
		
		MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "utf-8");
		
		mimeMessage.setContent(htmlMsg, "text/html");
		helper.setTo(u.getString("email"));
		helper.setTo("li.horace@gmail.com");
		helper.setSubject(subject);
		helper.setFrom(from);
		mailSender.send(mimeMessage);
		
		return true;
	}
}
