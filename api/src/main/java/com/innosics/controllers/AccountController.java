/**
 * Author: Rosy Yang <rosy.yang@gmail.com>
 */
package com.innosics.controllers;

import java.io.BufferedReader;
import java.security.Principal;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import com.innosics.auth.MongoUserDetailsService;
import com.innosics.services.AccountService;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailSender;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class AccountController {

	final static Logger logger = Logger.getLogger(AccountController.class);
	
	@Autowired
	AccountService accountService;
	
	@Autowired
	private MailSender mailSender;
	
	@RequestMapping(value = "/register", method = RequestMethod.POST)
	public @ResponseBody BasicDBObject createAccount(HttpServletRequest request, Principal principal) {
		logger.debug("***try to ****createAccount*******"); 
		
		StringBuffer jb = new StringBuffer();
		String line = null;
		try {
			BufferedReader reader = request.getReader();
			while ((line = reader.readLine()) != null)
				jb.append(line);
		} catch (Exception e) { /*report an error*/ }
	
		String dataStr = jb.toString();
		Object o = JSON.parse(dataStr);
		BasicDBObject r = new BasicDBObject();
		if (o instanceof DBObject){
			r = accountService.createUser((BasicDBObject)o);
			logger.debug("******createAccount*******" + r); 
		}
				
		return r;
	}
	
	@RequestMapping(value = "/confirm/{_id}", method = RequestMethod.GET)
	public ModelAndView confirmAccount(HttpServletRequest request, Principal principal, @PathVariable String _id) {
		logger.debug("***try to ****confirmAccount******* GET"); 
						
		String origin = request.getParameter("origin");
		
		ModelAndView mv = new ModelAndView("confirm_form");
		
		mv.addObject("origin", origin);
		mv.addObject("action", "/api/confirm/" + _id);
 
		return mv;
	}
	
	@RequestMapping(value = "/confirm/{_id}", method = RequestMethod.POST)
	public ModelAndView confirmAccountPost(HttpServletRequest request, Principal principal, @PathVariable String _id) {
		logger.debug("***try to ****confirmAccount******* POST"); 

		String origin = request.getParameter("origin");
		String password = request.getParameter("password");
		
		BasicDBObject wrap = accountService.confirmUser(_id, password);
		
		if (wrap.getBoolean("success")){
			ModelAndView mv = new ModelAndView("confirm");
			mv.addObject("origin", origin);
	 
			return mv;
		}else{
			ModelAndView mv = new ModelAndView("confirm_form");
			
			mv.addObject("msg", "Confirmation was not successful, try again?");
			mv.addObject("origin", origin);
			mv.addObject("action", "/api/confirm/" + _id);
	 
			return mv;
		}
	}
	@RequestMapping(value = "/reqreset", method = RequestMethod.GET)
	public @ResponseBody BasicDBObject requestPasswordReset(HttpServletRequest request, Principal principal) {
		logger.debug("***try to ****resetPaaword******* GET"); 
						
		String email = request.getParameter("email");
		String origin = request.getParameter("origin");
		return accountService.requestResetPassword(email, origin, "/api/reset");
	}

	@RequestMapping(value = "/reset/{_id}", method = RequestMethod.GET)
	public ModelAndView resetPaawordForm(HttpServletRequest request, Principal principal, @PathVariable String _id) {
		logger.debug("***try to ****resetPaaword******* GET"); 
						
		String origin = request.getParameter("origin");
		
		ModelAndView mv = new ModelAndView("reset_form");
		
		mv.addObject("origin", origin);
		mv.addObject("_id", _id);
		mv.addObject("action", "/api/reset/" + _id);
		 
		return mv;
	}
	
	@RequestMapping(value = "/reset/{_id}", method = RequestMethod.POST)
	public ModelAndView resetPaaword(HttpServletRequest request, Principal principal, @PathVariable String _id) {
		logger.debug("***try to ****confirmAccount******* POST"); 

		String origin = request.getParameter("origin");
		String password = request.getParameter("password");
		String password2 = request.getParameter("password2");
		
		String msg = "";
		boolean valid = true;
		if (! password.equals(password2)){
			valid = false;
			msg = "Password re-entered is not matched, lease try again!";
		}
		if (valid){
			BasicDBObject wrap = accountService.resetPassword(_id, password);
			
			if (wrap.getBoolean("success")){
				ModelAndView mv = new ModelAndView("reset");
				mv.addObject("origin", origin);
		 
				return mv;
			}else{
				ModelAndView mv = new ModelAndView("error");
				mv.addObject("msg", "Reset request expired");
		 
				return mv;
			}
		}

		ModelAndView mv = new ModelAndView("reset_form");
		
		mv.addObject("origin", origin);
		mv.addObject("_id", _id);
		mv.addObject("action", "/api/reset");
		mv.addObject("msg", msg);
		 
		return mv;
	}
}