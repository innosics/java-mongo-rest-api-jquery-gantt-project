/**
 * Author: Rosy Yang <rosy.yang@gmail.com>
 */
package com.innosics.controllers;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.UnsupportedEncodingException;
import java.security.Principal;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.provider.OAuth2Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.innosics.services.APIService;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;

@Controller
public class APIController {
	
	final static Logger logger = Logger.getLogger(APIController.class);
    
	@Autowired
	APIService apiService;

	@RequestMapping(value = "/fetch/{dbName}/{coll}/{_id}", method = RequestMethod.GET)
	public @ResponseBody BasicDBObject getDataObject(HttpServletRequest request, @RequestParam(value = "callback", required = false) String callback, Principal principal, @PathVariable String coll, @PathVariable String dbName, @PathVariable String _id) {
		
		BasicDBObject o = apiService.find(dbName, coll, _id, principal);
				
		return o;
	}
	
	@RequestMapping(value = "/list/{dbName}/{coll}", method = RequestMethod.GET)
	public @ResponseBody BasicDBObject listDataList(HttpServletRequest request, @RequestParam(value = "callback", required = false) String callback, Principal principal, @PathVariable String coll, @PathVariable String dbName) {
		
		BasicDBObject query = new BasicDBObject();
		Map<String, String[]> parameters = request.getParameterMap();
		for(String key : parameters.keySet()) {
	        String[] vals = parameters.get(key);
	        for(String val : vals){
	        	logger.debug("APIController*******getDataList*******key*******" + key + "******valvue*******" + val);
	        	if (key.equals("filterslength") || key.equals("pagenum") || key.equals("pagesize") || key.equals("_") || key.equals("access_token")) {
	        	}else{
	        		if (val.indexOf("$gt") >= 0){
	        			query.append(key, new BasicDBObject("$gt", Double.valueOf(val.substring(3))));
	        		}else if (val.indexOf("$lte") >= 0){
	        			query.append(key, new BasicDBObject("$lte", Double.valueOf(val.substring(4))));
	        		}else if (val.indexOf("$btn") >= 0){	        			
	        			query.append(key, 
	        					new BasicDBObject("$gt", Double.valueOf(val.substring(4, val.indexOf("|"))))
	        				.append("$lte", Double.valueOf(val.substring(val.indexOf("|") + 1)))
	        			);
	        		}else{
	        			query.append(key, val);
	        		}
	        	}
	        }
		}
		logger.debug("APIController*******getDataList*******query*******" + query);
		BasicDBObject l = apiService.list(dbName, coll, query, principal);
				
		return l;
	}

	@RequestMapping(value = "/save/{dbName}/{coll}", method = RequestMethod.POST)
	public @ResponseBody BasicDBObject saveDataList(HttpServletRequest request, Principal principal, @PathVariable String coll, @PathVariable String dbName) {
		
		logger.debug("****saveDataList*******coll*******" + coll);
		logger.debug("****saveDataList*******principal*******" + principal.getClass().getName());
		if (principal instanceof OAuth2Authentication){
			OAuth2Authentication auth = (OAuth2Authentication) principal;
			/*
			logger.debug("****saveDataList*******auth.getDetails()*******" + auth.getDetails().getClass().getName());
			logger.debug("****saveDataList*******auth.getDetails()*******" + auth.getUserAuthentication().getClass().getName());
			logger.debug("****saveDataList*******auth.getDetails()*******" + auth.getCredentials().getClass().getName());
			logger.debug("****saveDataList*******auth.getDetails()*******" + auth.getAuthorizationRequest().getClass().getName());*/
		}
		logger.debug("****saveDataList*******principal*******" + principal.getName());
		String dataStr = request.getParameter("data");
		logger.debug("****saveDataList*******data=" + dataStr);
		
		BasicDBObject r;
		Object o = JSON.parse(dataStr);
		if (o != null){
			logger.debug("****saveDataList*******o*******" + o);
			logger.debug("****saveDataList*******o.class*******" + o.getClass().getName());
			if (o instanceof BasicDBObject){
				r = apiService.save(dbName, coll, (BasicDBObject)o, principal);
				logger.debug("*******find _id*******r _id*******" + r.getString("_id")); 
			}else if (o instanceof BasicDBList){
				/*
				BasicDBList l = (BasicDBList) o;
				for (int i = 0; i < l.size(); i ++){
					BasicDBObject obj = (BasicDBObject) l.get(i);
					apiService.save(dbName, coll, obj, principal);
					logger.debug("APIService*******find _id*******obj _id*******" + obj.getString("_id")); 
				}*/
				r = new BasicDBObject("success", false)
				.append("MESSAGE", "List update not yet support")
				.append("data", o);
			}else{
				r = new BasicDBObject("success", false)
						.append("MESSAGE", "Data format not understand")
						.append("data", o);
			}
		}else{
			r = new BasicDBObject("success", false)
					.append("MESSAGE", "Data posted is null")
					.append("data", new BasicDBObject());
		}
		
		return r;
	}
	public static String slurp(final InputStream is, final int bufferSize)
	{
	  final char[] buffer = new char[bufferSize];
	  final StringBuilder out = new StringBuilder();
	  try {
	    final Reader in = new InputStreamReader(is, "UTF-8");
	    try {
	      for (;;) {
	        int rsz = in.read(buffer, 0, buffer.length);
	        if (rsz < 0)
	          break;
	        out.append(buffer, 0, rsz);
	      }
	    }
	    finally {
	      in.close();
	    }
	  }
	  catch (UnsupportedEncodingException ex) {
	    ex.printStackTrace();
	  }
	  catch (IOException ex) {
	      ex.printStackTrace();
	  }
	  return out.toString();
	}
}
