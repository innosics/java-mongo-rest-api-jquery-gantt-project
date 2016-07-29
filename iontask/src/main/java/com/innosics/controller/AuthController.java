/**
 * Author: Rosy Yang <rosy.yang@gmail.com>
 */
package com.innosics.controller;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.mongodb.BasicDBObject;
import com.mongodb.util.JSON;

@Controller
public class AuthController {
	
	final static String CLIENT_ID = "AF0E16BFAFAA4A37916ECE25ECD420A2";
	final static String CLIENT_SECRET = "9793FBBE8FD84615B31D4E68FDD4063C";
	
	final static Logger logger = Logger.getLogger(AuthController.class);

	@RequestMapping(value = "/token", method = RequestMethod.POST)
	public @ResponseBody BasicDBObject authenticate(HttpServletRequest request, @RequestParam(value = "callback", required = false) String callback, Principal principal) {

		try{
			logger.debug("---------------authenticate-----------");
			
			URL obj = new URL("http://localhost:8080/api/oauth/token");
			HttpURLConnection con = (HttpURLConnection) obj.openConnection();
			con.setRequestMethod("POST");
			
			String data = null;
			String grant_type = request.getParameter("grant_type");
			
			if (grant_type.equals("password")){
				String username = request.getParameter("username"); //"a@a.aa";
				String password = request.getParameter("password"); //"aaaaaa";
				
				data = "grant_type=password&client_id=" + CLIENT_ID + "&client_secret=" + CLIENT_SECRET + "&username=" + username + "&password=" + password + "&scope=read,write,trust";
			}else if (grant_type.equals("refresh_token")){
				String refresh_token = request.getParameter("refresh_token");
				
				data = "grant_type=refresh_token&client_id=" + CLIENT_ID + "&client_secret=" + CLIENT_SECRET + "&refresh_token=" + refresh_token + "&scope=read,write,trust";
			}

			System.out.println("--------AuthController data : " + data);
			
			con.setDoOutput(true);
			DataOutputStream wr = new DataOutputStream(con.getOutputStream());
			wr.writeBytes(data);
			wr.flush();
			wr.close();
			
			int responseCode = con.getResponseCode();
			System.out.println("Response Code : " + responseCode);
			
			BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()));
			String inputLine;
			StringBuffer response = new StringBuffer();
	 
			while ((inputLine = in.readLine()) != null) {
				response.append(inputLine);
			}
			in.close();
	 
			//print result
			String responseStr = response.toString();
			logger.debug("-----------authenticate-----responseStr------" + responseStr);
			//System.out.println(responseStr);
			BasicDBObject o = (BasicDBObject) JSON.parse(responseStr);
			o.append("success", true);

			System.out.println(o);
			
			return o;
			
		}catch(Exception e){
			logger.debug("-----------authenticate-----failed------" + e.getMessage());
			return new BasicDBObject("success", false).append("error", "auth error: " + e.getMessage());
		}
	}
}