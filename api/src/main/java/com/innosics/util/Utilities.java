/**
 * Author: Rosy Yang <rosy.yang@gmail.com>
 */
package com.innosics.util;

import java.security.Principal;

import com.innosics.config.Constance;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.paypal.api.payments.Payment;

public class Utilities {

	public static BasicDBObject wrap(Object data, boolean success, String msg){
		return new BasicDBObject("success", success)
		.append("MESSAGE", msg)
		.append("data", data);
	}

	public static BasicDBObject wrap(Object data, boolean success, String errorCode, String msg){
		return new BasicDBObject("success", success)
		.append("MESSAGE", msg)
		.append("code", errorCode)
		.append("data", data);
	}
	
	public static BasicDBObject createDefaultWorkspace(String _id, String defaultWorkspaceCode, String defaultWorkspaceName, String role, String user){
		BasicDBObject ws = new BasicDBObject("code", defaultWorkspaceCode).append("name", defaultWorkspaceName)
		;
		
		StringBuffer sb = new StringBuffer("<script>");
		sb

		.append("var default_workspace_id = '" + _id + "';") 
		.append("var default_workspace_code = '" + defaultWorkspaceCode + "';") 
		.append("var default_workspace_name = '" + defaultWorkspaceName + "';") 
		.append("var default_workspace_role = '" + role + "';") 
		
		.append("var current_workspace_id = '" + _id + "';") 
		.append("var current_workspace_code = '" + defaultWorkspaceCode + "';") 
		.append("var current_workspace_name = '" + defaultWorkspaceName + "';") 
		.append("var current_workspace_role = '" + role + "';") 
		
		.append("var current_user = '" + user + "';") 
		
		.append("var URL_SPACES_FETCH = DOMAIN_PREFIX + '/api/fetch/" + Constance.ACCOUNT_DB_NAME + "/workspaces/';") 
		.append("var URL_SPACES_LIST = DOMAIN_PREFIX + '/api/list/" + Constance.ACCOUNT_DB_NAME + "/workspaces';") 
		.append("var URL_SPACES_SAVE = DOMAIN_PREFIX + '/api/save/" + Constance.ACCOUNT_DB_NAME + "/workspaces';") 
		
		.append("var URL_ROLES_LIST = DOMAIN_PREFIX + '/api/list/" + defaultWorkspaceCode + "/roles';") 
		.append("var URL_ROLE_SAVE = DOMAIN_PREFIX + '/api/save/" + defaultWorkspaceCode + "/roles';") 
		
		.append("var URL_PERSON_FETCH = DOMAIN_PREFIX + '/api/fetch/" + defaultWorkspaceCode + "/members/';") 
		.append("var URL_PEOPLE_LIST = DOMAIN_PREFIX + '/api/list/" + defaultWorkspaceCode + "/members';") 
		.append("var URL_PERSON_SAVE = DOMAIN_PREFIX + '/api/save/" + defaultWorkspaceCode + "/members';") 
		
		.append("var URL_PROJECT_FETCH = DOMAIN_PREFIX + '/api/fetch/" + defaultWorkspaceCode + "/projects/';") 
		.append("var URL_MY_PROJECTS_LIST = DOMAIN_PREFIX + '/api/list/" + defaultWorkspaceCode + "/projects';") 
		.append("var URL_PROJECT_SAVE = DOMAIN_PREFIX + '/api/save/" + defaultWorkspaceCode + "/projects';") 
		
		.append("var URL_TASK_FETCH = DOMAIN_PREFIX + '/api/fetch/" + defaultWorkspaceCode + "/tasks/';") 
		.append("var URL_TASKS_LIST = DOMAIN_PREFIX + '/api/list/" + defaultWorkspaceCode + "/tasks';") 
		.append("var URL_TASK_SAVE = DOMAIN_PREFIX + '/api/save/" + defaultWorkspaceCode + "/tasks';") 
		
		.append("var URL_ONLINE_USERS_LIST = DOMAIN_PREFIX + '/api/list/" + defaultWorkspaceCode + "/onlineUsers';") 

		.append("var URL_UI_DEF = DOMAIN_PREFIX + '/api/fetch/" + defaultWorkspaceCode + "/uidef/';") 
		.append("var URL_FIND_UI_DEF = DOMAIN_PREFIX + '/api/find/" + defaultWorkspaceCode + "/uidef/';") 

		.append("var URL_DATA_SIMPLE_LIST = DOMAIN_PREFIX + '/api/" + defaultWorkspaceCode + "/list/';")
		
		.append("function setCurrentWorkspace(_id, code, name, role){")
		
			.append("current_workspace_id = _id;") 
			.append("current_workspace_code = code;") 
			.append("current_workspace_name = name;") 
			.append("current_workspace_role = role;") 
			
			.append("URL_ROLES_LIST = DOMAIN_PREFIX + '/api/list/' + code + '/roles';") 
			.append("URL_ROLE_SAVE = DOMAIN_PREFIX + '/api/save/' + code + '/roles';") 
			
			.append("URL_PERSON_FETCH = DOMAIN_PREFIX + '/api/fetch/' + code + '/members/';") 
			.append("URL_PEOPLE_LIST = DOMAIN_PREFIX + '/api/list/' + code + '/members';") 
			.append("URL_PERSON_SAVE = DOMAIN_PREFIX + '/api/save/' + code + '/members';") 
			
			.append("URL_PROJECT_FETCH = DOMAIN_PREFIX + '/api/fetch/' + code + '/projects/';") 
			.append("URL_MY_PROJECTS_LIST = DOMAIN_PREFIX + '/api/list/' + code + '/projects';") 
			.append("URL_PROJECT_SAVE = DOMAIN_PREFIX + '/api/save/' + code + '/projects';") 
			
			.append("URL_TASK_FETCH = DOMAIN_PREFIX + '/api/fetch/' + code + '/tasks/';") 
			.append("URL_TASKS_LIST = DOMAIN_PREFIX + '/api/list/' + code + '/tasks';") 
			.append("URL_TASK_SAVE = DOMAIN_PREFIX + '/api/save/' + code + '/tasks';") 
			
			.append("URL_ONLINE_USERS_LIST = DOMAIN_PREFIX + '/api/list/' + code + '/onlineUsers';") 
	
			.append("URL_UI_DEF = DOMAIN_PREFIX + '/api/fetch/' + code + '/uidef/';") 
			.append("URL_FIND_UI_DEF = DOMAIN_PREFIX + '/api/find/' + code + '/uidef/';") 
	
			.append("URL_DATA_SIMPLE_LIST = DOMAIN_PREFIX + '/api/' + code + '/list/';")

			.append("var wsn = $('#defaultWorkspaceName');")
			.append("if (wsn){")
				.append("wsn.empty();")
				.append("wsn.append(name);")
				.append("}")
			.append("var wsnl = $('#defaultWorkspaceNameLogo');")
			.append("if (wsnl){")
				.append("wsnl.empty();")
				.append("wsnl.append(name);")
				.append("}")
		
		.append("}")
		
		.append("</script>");
		
		ws.append("vars", sb.toString());
		
		return ws;
	}
	public static double getSpacePrices(int term) throws Exception {
		//should be define in db, temp hard code
		if (term == 0){
			return 0;
		}else if (term == 1){
			return 4.99;
		} else if (term == 6){
			return 24.99;
		} else if (term == 12){
			return 44.99;
		} else if (term == 36){
			return 99.99;
		}
		throw new Exception("not supported");
	}
	public static double getMembersPrices(int maxms) {
		//should be define in db, temp hard code
		if (maxms <= 5){
			return 1.99;
		} else if (maxms > 5 && maxms <= 10){
			return 1.49;
		} else if (maxms > 10 && maxms <= 50){
			return 0.99;
		} else if (maxms > 50 && maxms <= 100){
			return 0.89;
		} else if (maxms > 100 && maxms <= 500){
			return 0.49;
		} else{
			return 0.49;
		}
	}
	public static double getTaxRate() {
		//should be define in db, temp hard code
		return 0.13;
	}
}