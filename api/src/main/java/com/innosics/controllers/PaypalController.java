/**
 * Author: Rosy Yang <rosy.yang@gmail.com>
 */
package com.innosics.controllers;

import java.io.BufferedReader;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import com.innosics.auth.MongoUserDetailsService;
import com.innosics.config.Constance;
import com.innosics.services.APIService;
import com.innosics.services.AccountService;
import com.innosics.util.Utilities;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import com.paypal.api.payments.Payment;
import com.paypal.api.payments.PaymentExecution;

import org.apache.log4j.Logger;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class PaypalController {

	final static Logger logger = Logger.getLogger(PaypalController.class);
	
	@Autowired
	APIService apiService;

	@RequestMapping(value = "/pay/{dbName}", method = RequestMethod.POST)
	public @ResponseBody BasicDBObject createPayment(HttpServletRequest request, @RequestParam(value = "callback", required = false) String callback, Principal principal, @PathVariable String dbName) {

		logger.debug("****createPayment*******dbName*******" + dbName);
		logger.debug("****createPayment*******principal*******" + principal.getName());
		String returnURL = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + request.getContextPath();
		
		try {
			String dataStr = request.getParameter("data");
			String access_token = request.getParameter("access_token");
			logger.debug("****createPayment*******data=" + dataStr);
			
			BasicDBObject r;
			BasicDBObject payment;
			Object o = JSON.parse(dataStr);
			if (o != null){
				//logger.debug("****createPayment*******o*******" + o);
				logger.debug("****createPayment*******o.class*******" + o.getClass().getName());
				if (o instanceof BasicDBObject){
					r = (BasicDBObject)o;
					//here----------------
					
					BasicDBObject result = apiService.requestPayment(r, returnURL, access_token, principal);
					if (result.getBoolean("success")){
						BasicDBObject data = (BasicDBObject) result.get("data");
						String approvalURL = data.getString("approvalURL");
						
						//return new ModelAndView("redirect:" + approvalURL);
						//return paypal;
						return Utilities.wrap(new BasicDBObject("approvalURL", approvalURL).append("success", true), true, "");
					}else{
						return result;
					}
				}
			}
		}catch(Exception e){
			logger.error(e.getMessage());
			e.printStackTrace();
		}
		//return new ModelAndView("redirect:" + returnURL);
		return Utilities.wrap(new BasicDBObject("uid", principal.getName()).append("success", false), false, "Data error");
	}
	@RequestMapping(value = "/paypal/{dbName}", method = RequestMethod.GET)
	public ModelAndView paypalPayment(HttpServletRequest request, @RequestParam(value = "callback", required = false) String callback, Principal principal, @PathVariable String dbName) {

		logger.debug("****paypalPayment*******dbName*******" + dbName);
		logger.debug("****paypalPayment*******principal*******" + principal.getName());
		BasicDBObject result = null;
		
		String remote = request.getRemoteHost();
		logger.debug("****paypalPayment*******remote*******" + remote);
		//return back to paypal.jsp
		//ModelAndView model = new ModelAndView("invoice");
		
		String origin = request.getParameter("origin");
		logger.debug("****paypalPayment*******origin*******" +origin);
		String cancel = request.getParameter("cancel");
		if (cancel != null && cancel.equals("yes")){
			//cancel order
		}else{
			String _id = request.getParameter("_id");
			String guid = request.getParameter("guid");
			String paymentId = request.getParameter("paymentId");
			String PayerID = request.getParameter("PayerID");
			String token = request.getParameter("token");
							
			try {
				result = apiService.executePayment(_id, paymentId, PayerID, principal);
			}catch(Exception e){
				logger.error(e.getMessage());
				e.printStackTrace();
			}
		}
		//logger.debug("****paypalPayment*******result*******" + result);
		//model.addObject("origin", origin);
		//model.addObject("payment", result);
		//return model; // eventually this have to go the jsp and show user the invoice
		return new ModelAndView("redirect:" + origin);
	}
}
