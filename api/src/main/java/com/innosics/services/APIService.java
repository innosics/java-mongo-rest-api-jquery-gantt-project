/**
 * Author: Rosy Yang <rosy.yang@gmail.com>
 */
package com.innosics.services;

import java.io.InputStream;
import java.security.Principal;
import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Iterator;
import java.util.List;
import java.util.UUID;

import org.apache.log4j.Logger;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.innosics.config.Constance;
import com.innosics.util.Utilities;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.MongoClient;
import com.mongodb.util.JSON;
import com.paypal.api.payments.Amount;
import com.paypal.api.payments.Details;
import com.paypal.api.payments.Item;
import com.paypal.api.payments.ItemList;
import com.paypal.api.payments.Links;
import com.paypal.api.payments.Payer;
import com.paypal.api.payments.Payment;
import com.paypal.api.payments.PaymentExecution;
import com.paypal.api.payments.RedirectUrls;
import com.paypal.api.payments.Transaction;
import com.paypal.base.rest.APIContext;
import com.paypal.base.rest.OAuthTokenCredential;
import com.paypal.base.rest.PayPalRESTException;
import com.paypal.base.rest.PayPalResource;

@Service
public class APIService {

	final static Logger logger = Logger.getLogger(APIService.class);
		
	private MongoClient mongoClient;
	
	@Autowired
	private MailSender mailSender;
	
	public APIService() throws Exception {
		mongoClient = new MongoClient( "localhost" , 27017 );
		
		InputStream is = APIService.class.getResourceAsStream("/sdk_config.properties");
		PayPalResource.initConfig(is);
	}

	public BasicDBObject find(String dbName, String collectionName, String _id, Principal principal) {  
		BasicDBObject q = new BasicDBObject();
	    logger.debug("*****find*******dbName*******" + dbName); 
	    logger.debug("*****find*******collectionName*******" + collectionName); 
	    logger.debug("*****find*******_id*******" + _id); 
	    if (_id != null) {
	    	if (_id.equals("EMPTY")){
	    		return emptyObject(dbName, collectionName, _id, principal);
	    	}else if (_id.equals("default")){
	    		return defaultObject(dbName, collectionName, _id, principal);
	    	}else{
		    	q.put("_id", new ObjectId(_id));	   
			    
		    	return find(dbName, collectionName, q, principal); 		
	    	}
	    }
	    return Utilities.wrap(new BasicDBObject(), false, "No object _id found in the query");
	}
	private BasicDBObject find(String dbName, String collectionName, BasicDBObject q, Principal principal){
		if (collectionName.equals(Constance.ACCOUNT_WORKSPACE_COLLECTION)){
			return findWorkspace(q, principal);
		} else if (collectionName.equals("projects")){
	    	return findProject (dbName, q, principal);
		} else if (collectionName.equals("tasks")) {
			return findTask(dbName, collectionName, q, principal);
		}else{
			/*for those common objects, everyone should be able to access*/
			return findObject (dbName, collectionName, q, principal);
		} 
	}
	private BasicDBObject findWorkspace(BasicDBObject q, Principal principal) {  
		DBObject clause1 = new BasicDBObject("members.email", principal.getName());  
		DBObject clause2 = new BasicDBObject("principal", principal.getName());    
		BasicDBList or = new BasicDBList();
		or.add(clause1);
		or.add(clause2);
		q.append("$or", or);
		
		return findObject (Constance.ACCOUNT_DB_NAME, Constance.ACCOUNT_WORKSPACE_COLLECTION, q, principal);
	}
	private BasicDBObject findProject(String dbName,BasicDBObject q, Principal principal) {  
		
		DBObject clause1 = new BasicDBObject("resources.email", principal.getName());  
		DBObject clause2 = new BasicDBObject("principal", principal.getName());    
		BasicDBList or = new BasicDBList();
		or.add(clause1);
		or.add(clause2);
		q.append("$or", or);
		
		logger.debug("*******findProject*******q*******" + q); 
		
		BasicDBObject project = (BasicDBObject) findObject (dbName, "projects", q, principal).get("data");
		String projectId = project.getString("_id");
		BasicDBObject query = new BasicDBObject("projectId", projectId);
		
		BasicDBObject propertyKeys = new BasicDBObject("projectResources", 0).append("projectRoles", 0);
		BasicDBList tasks = (BasicDBList) listObjects(dbName, "tasks", query, propertyKeys, principal).get("data");
		
		project.put("tasks", tasks);
		
		BasicDBObject rq = new BasicDBObject("status", "ACTIVE");
		BasicDBList roles = (BasicDBList) listObjects(dbName, "roles", rq, null, principal).get("data");
		project.put("roles", roles);
		
		boolean isPM = false;
		String owner = project.getString("principal");
		logger.debug("*******listProject*******owner******" + owner); 
		if (owner != null && owner.equals(principal.getName())){
			isPM = true;
		}
		logger.debug("*******listProject*******isPM******" + isPM); 
		if (! isPM){
			BasicDBList res = (BasicDBList) project.get("resources");
			if (res != null) {
				for (int r = 0; r < res.size(); r ++){
					BasicDBObject assign = (BasicDBObject) res.get(r);
					logger.debug("*******listProject*******assign******" + assign); 
					String email = assign.getString("email");
					logger.debug("*******listProject*******email******" + email); 
					if ( email.equals("PM")){
						isPM = true;
						break;
					}
				}
			}
		}
		logger.debug("*******listProject*******isPM******" + isPM); 
		if (! isPM){
			project.put("canWrite", false);
		}
		
		//logger.debug("APIService*******findProject*******project*******" + project); 
		
		return (BasicDBObject) Utilities.wrap(project, true, "Project find successfully");
	}
	private BasicDBObject findTask(String dbName, String collectionName, BasicDBObject q, Principal principal){		
		DBObject clause1 = new BasicDBObject("assigs.email", principal.getName());  
		DBObject clause2 = new BasicDBObject("principal", principal.getName());    
		BasicDBList or = new BasicDBList();
		or.add(clause1);
		or.add(clause2);
		q.append("$or", or);
		
		return findObject (dbName, collectionName, q, principal);
	}
	private BasicDBObject findObject(String dbName, String collectionName, BasicDBObject q, Principal principal) {  
		logger.debug("*******findObject*******dbName*******" + dbName); 
		logger.debug("*******findObject*******collectionName*******" + collectionName); 
		DB db = mongoClient.getDB(dbName);
		DBCollection coll = db.getCollection(collectionName);
		
	    logger.debug("*******find*******q*******" + q); 
	    BasicDBObject r = (BasicDBObject) coll.findOne(q);
		
		if (r != null){
			logger.debug("*******find _id*******r _id*******" + r.getString("_id")); 
			r.put("_id", r.getString("_id"));
			return Utilities.wrap(r, true, "Object find successfully");
		}

		return Utilities.wrap(r, false, "Object not found");
	}     
	public BasicDBObject list(String dbName, String collectionName, BasicDBObject query, Principal principal) {  
		logger.debug("*******list*******dbName*******" + dbName); 
		logger.debug("*******list*******collectionName*******" + collectionName); 
		if (collectionName.equals(Constance.ACCOUNT_WORKSPACE_COLLECTION)){
			return listWorkspaces(query, principal);
		}else if (collectionName.equals("projects")){
			return listProject(dbName, query, principal);
		}else if (collectionName.equals("tasks")){
			return listTasks(dbName, query, principal);
		}else{
			return listObjects(dbName, collectionName, query, null, principal);
		} 
	}  
	private BasicDBObject listWorkspaces(BasicDBObject q, Principal principal) {  
		
		DBObject clause1 = new BasicDBObject("members.email", principal.getName());  
		DBObject clause2 = new BasicDBObject("principal", principal.getName());    
		BasicDBList or = new BasicDBList();
		or.add(clause1);
		or.add(clause2);
		q.append("$or", or);
		
		BasicDBObject wsWrap = listObjects(Constance.ACCOUNT_DB_NAME, Constance.ACCOUNT_WORKSPACE_COLLECTION, q, null, principal);
		
		//find the role in the space
		logger.debug("*******listWorkspaces*******looking for role for each space*******"); 
		BasicDBList spaces = (BasicDBList) wsWrap.get("data");
		String role = "no";
		for (int i = 0; i < spaces.size(); i ++){
			BasicDBObject r = (BasicDBObject) spaces.get(i);
			String code = r.getString("code");
			logger.debug("*******listWorkspaces*******r***code****" + code); 
			logger.debug("*******listWorkspaces*******r***principal****" + r.getString("principal")); 
			if (principal.getName().equals(r.getString("principal"))){
				role = "admin";
			}else{
				logger.debug("*******listWorkspaces*******r***try to find member****"); 
				BasicDBObject mq = new BasicDBObject("email", principal.getName());
				DB db = mongoClient.getDB(code);
				DBCollection coll = db.getCollection("members");
				
			    BasicDBObject member = (BasicDBObject) coll.findOne(mq);
				
				if (member != null){
					logger.debug("*******find _id*******r _id*******" + r.getString("_id")); 
					member.put("_id", member.getString("_id"));
					role = member.getString("role");
				}else{
					role = "no";
				}
				logger.debug("*******listWorkspaces*******r***find role****" + role); 
			}
			r.put("role", role);
		}
		return wsWrap;
	}
	private BasicDBObject listProject(String dbName, BasicDBObject q, Principal principal) {  
		DBObject clause1 = new BasicDBObject("resources.email", principal.getName());  
		DBObject clause2 = new BasicDBObject("principal", principal.getName());    
		BasicDBList or = new BasicDBList();
		or.add(clause1);
		or.add(clause2);
		q.append("$or", or);
		
		logger.debug("*******listProject*******q*******" + q); 
		
		BasicDBList projects = (BasicDBList) listObjects(dbName, "projects", q, null, principal).get("data");
		
		if (projects != null){
			for (int i = 0; i < projects.size(); i ++) {
				BasicDBObject project = (BasicDBObject) projects.get(i);
				String projectId = project.getString("_id");
				BasicDBObject tq = new BasicDBObject("projectId", projectId);
				BasicDBObject propertyKeys = new BasicDBObject("projectResources", 0).append("projectRoles", 0);
				BasicDBList tasks = (BasicDBList) listObjects(dbName, "tasks", tq, propertyKeys, principal).get("data");
				
				project.put("tasks", tasks);
				
				
				if (! isPM(project, principal)){
					project.put("canWrite", false);
				}
			}
		}
		return Utilities.wrap(projects, true, "Projects retrieved successfully");
	}
	private boolean isPM(BasicDBObject project, Principal principal){
		boolean isPM = false;
		String owner = project.getString("principal");
		logger.debug("*******listProject*******owner******" + owner); 
		if (owner != null && owner.equals(principal.getName())){
			isPM = true;
		}
		logger.debug("*******listProject*******isPM******" + isPM); 
		if (! isPM){
			BasicDBList res = (BasicDBList) project.get("resources");
			if (res != null) {
				for (int r = 0; r < res.size(); r ++){
					BasicDBObject assign = (BasicDBObject) res.get(r);
					logger.debug("*******listProject*******assign******" + assign); 
					String email = assign.getString("email");
					logger.debug("*******listProject*******email******" + email); 
					if ( email.equals("PM")){
						isPM = true;
						break;
					}
				}
			}
		}
		return isPM;
	}
	private BasicDBObject listTasks(String dbName, BasicDBObject query, Principal principal) { 
		DBObject clause1 = new BasicDBObject("assigs.email", principal.getName());  
		DBObject clause2 = new BasicDBObject("principal", principal.getName());    
		BasicDBList or = new BasicDBList();
		or.add(clause1);
		or.add(clause2);
		query.append("$or", or);
		
		return listObjects(dbName, "tasks", query, null, principal);
	}
	private BasicDBObject listObjects(String dbName, String collectionName, BasicDBObject query, BasicDBObject propertyKeys, Principal principal) {  
		logger.debug("******listObjects*******dbName*******" + dbName); 
		logger.debug("******listObjects*******collectionName*******" + collectionName); 
		
		BasicDBList l = new BasicDBList();
		DB db = mongoClient.getDB(dbName);
		DBCollection coll = db.getCollection(collectionName);
		
		logger.debug("******listObjects*******query*******" + query);
		DBCursor cursor = null; 
		if (collectionName.equalsIgnoreCase("users")){
			if (propertyKeys == null){
				propertyKeys = new BasicDBObject("password", 0); //todo: this removed password when updated, have to change
			}else{
				propertyKeys.append("password", 0);
			}
			cursor = coll.find(query, propertyKeys);
			logger.debug("*******listObjects*******propertyKeys*******" + propertyKeys);
		}else{
			if (propertyKeys == null){
				cursor = coll.find(query);
			}else{
				cursor = coll.find(query, propertyKeys);
			}
		}
		try {
		   while(cursor.hasNext()) {
			   BasicDBObject r = (BasicDBObject) cursor.next();
			   r.put("_id", r.getString("_id"));
		       l.add(r);
		   }
		} finally {
		   cursor.close();
		}
		logger.debug("******listObjects*******l size*******" + l.size());
		
		return Utilities.wrap(l, true, "Data retrieved successfully");    
	}  
	public BasicDBObject save(String dbName, String collectionName, BasicDBObject o, Principal principal) {  
		if (collectionName.equals(Constance.ACCOUNT_WORKSPACE_COLLECTION)){
			return setDefaultWorkspace (o.getString("_id"), principal);
		}else if (collectionName.equals("members")){
			return saveMember (dbName, o, principal);
		}else if (collectionName.equals("projects")){
			return saveProject (dbName, o, principal);
		}else if (collectionName.equals("tasks")){
			return saveTask (dbName, o, principal);
		} else {
			return saveObject (dbName, collectionName, o, principal);
		} 
	}    
	private BasicDBObject setDefaultWorkspace(String _id, Principal principal) {
		logger.debug("*******setDefaultWorkspace*******_id*******" + _id); 
		
		BasicDBObject q = new BasicDBObject();
		q.append("paid", true)
		.append("expiry", new BasicDBObject("$gt", (new java.util.Date()).getTime()));
		
		DBObject clause1 = new BasicDBObject("members.email", principal.getName());  
		DBObject clause2 = new BasicDBObject("principal", principal.getName());    
		BasicDBList or = new BasicDBList();
		or.add(clause1);
		or.add(clause2);
		q.append("$or", or);
		
		q.append("_id", new ObjectId(_id));
		
		
		BasicDBObject wsWrap = (BasicDBObject) findWorkspace(q, principal);
		BasicDBObject ws = (BasicDBObject) wsWrap.get("data");
		
		String _wsId = ws.getString("_id");

	    logger.debug("******setDefaultWorkspace*******_wsId*******" + _wsId); 
		
		BasicDBObject u = findPrincipalUser(principal);
		u.put("defaultSpaceId", _wsId);
		
		updateObject (Constance.ACCOUNT_DB_NAME, "users", u, principal);

	    logger.debug("******setDefaultWorkspace*******u*******" + u); 
	    
		logger.debug("*******setDefaultWorkspace*******user updated with default ws*******" + _id); 
		
		return Utilities.wrap(new BasicDBObject("_id", _id).append("code", ws.getString("code")).append("name", ws.getString("name")), true, "Data retrieved successfully");
	}
	
	private BasicDBObject saveMember (String dbName, BasicDBObject member, Principal principal) {
		logger.debug("*******saveMember*******member*******" + member); 
		String _id = member.getString("_id");
		if (_id != null){
			updateObject (dbName, "members", member, principal);
		}else{
			//check if exists
			DB db = mongoClient.getDB(dbName);
			DBCollection coll = db.getCollection("members");
			BasicDBObject query = new BasicDBObject("email", member.getString("email"));
		    logger.debug("******saveMember*******query*******" + query); 
		    BasicDBObject existsObj = (BasicDBObject) coll.findOne(query);
		    
		    if (existsObj != null){
		    	return Utilities.wrap(member, false, Constance.ERROR_MEMBER_EXISTS, "Member exists");
		    }
			
			createObject (dbName, "members", member, principal);
			
			if (! dbName.equals(Constance.DEFAULT_WORKSPACE_CODE)){
				//find the workspace
				BasicDBObject q = new BasicDBObject("code", dbName);   
				BasicDBObject r = findObject(Constance.ACCOUNT_DB_NAME, Constance.ACCOUNT_WORKSPACE_COLLECTION, q, principal);
				BasicDBObject space = (BasicDBObject) r.get("data");
				logger.debug("*******saveMember*******space _id*******" + space.getString("_id")); 
				
				BasicDBList members = (BasicDBList) space.get("members");
				if (members == null){
					members = new BasicDBList();
				}
				members.add(member);
				
				space.put("members", members);
				
				updateObject (Constance.ACCOUNT_DB_NAME, Constance.ACCOUNT_WORKSPACE_COLLECTION, space, principal);
				logger.debug("*******saveMember*******member*******done");
			}
		}
		return Utilities.wrap(member, true, "Member saved successfully");
	}
	private BasicDBObject saveProject (String dbName, BasicDBObject project, Principal principal) {
		//todo: have to check if user have right to save
		BasicDBList tasks = (BasicDBList) project.get("tasks");
		project.remove("tasks");
		
		String _id = project.getString("_id");
		if (_id != null && (!_id.equals("empty"))&& (!_id.trim().equals(""))){

			BasicDBObject q = new BasicDBObject("_id", new ObjectId(_id));
		    
			DBObject clause1 = new BasicDBObject("resources.email", principal.getName());  
			DBObject clause2 = new BasicDBObject("principal", principal.getName());    
			BasicDBList or = new BasicDBList();
			or.add(clause1);
			or.add(clause2);
			q.append("$or", or);
			
		    logger.debug("*******saveProject*******q*******" + q); 
		    DB db = mongoClient.getDB(dbName);
			DBCollection coll = db.getCollection("projects");
		    BasicDBObject r = (BasicDBObject) coll.findOne(q);
		    
		    if (r != null && isPM(r, principal)){
		    	updateObject(dbName, "projects", project, principal);
		    }else{
		    	return Utilities.wrap(project, false, "Not authorized, not PM");
		    }
		    
		}else{
			createObject(dbName, "projects", project, principal);
		}

		//logger.debug("*******save saveProject project before task save**************\n" + project); 
		
		String projectId = project.getString("_id");
		String projectName = project.getString("name");
		String projectCode = project.getString("code");
		
		logger.debug("*******save saveProject before task save*******projectId*******\n" + projectId);
		
		for (int i = 0; i < tasks.size(); i ++){
			BasicDBObject task = (BasicDBObject) tasks.get(i);
			logger.debug("APIService****saveProject before task save****task _id****\n" + task.getString("_id"));
			task.put("projectId", projectId);
			task.put("projectCode", projectCode);
			task.put("projectName", projectName);
			task.put("projectResources", project.get("resources"));
			task.put("projectRoles", project.get("roles"));
			//logger.debug("*******saveProject before task save*******task*******\n" + task);
			saveObject(dbName, "tasks", task, principal);
			//logger.debug("*******save saveProject task**************\n" + task); 
		}
		project.put("tasks", tasks);
		
		//logger.debug("*******save saveProject project after task save**************\n" + project); 
		
		return Utilities.wrap(project, true, "Project saved successfully");
	}
	private BasicDBObject saveTask (String dbName, BasicDBObject task, Principal principal) {
		String _id = task.getString("_id");
		if (_id != null && (!_id.equals("empty"))&& (!_id.trim().equals(""))){

			BasicDBObject q = new BasicDBObject("_id", new ObjectId(_id));
		    
			DBObject clause1 = new BasicDBObject("assigs.email", principal.getName());  
			DBObject clause2 = new BasicDBObject("principal", principal.getName());    
			BasicDBList or = new BasicDBList();
			or.add(clause1);
			or.add(clause2);
			q.append("$or", or);
			
		    logger.debug("*******saveTask*******q*******" + q); 
		    DB db = mongoClient.getDB(dbName);
			DBCollection coll = db.getCollection("tasks");
		    BasicDBObject r = (BasicDBObject) coll.findOne(q);
		    
		    if (r != null){
		    	return updateObject(dbName, "tasks", task, principal);
		    }else{
		    	return Utilities.wrap(task, false, "Task not found");
		    }
		    
		}else{
		    logger.debug("*******saveTask*******new*******" + task); 
			return createObject(dbName, "tasks", task, principal);
		}
	}
	private BasicDBObject saveObject (String dbName, String collectionName, BasicDBObject o, Principal principal) {
		DB db = mongoClient.getDB(dbName);
		DBCollection coll = db.getCollection(collectionName);
		logger.debug("APIService*******save ********orignal******" + o);
		BasicDBObject r = null;
		
		String _id = o.getString("_id");
		BasicDBObject q = new BasicDBObject();
		if (_id != null && (!_id.equals("empty"))&& (!_id.trim().equals(""))){
		    q.put("_id", new ObjectId(_id));
		    logger.debug("APIService*******save*******q*******" + q); 
		    r = (BasicDBObject) coll.findOne(q);
		}
		if (r != null){
			return updateObject (dbName, collectionName, o, principal);
		}else{
			return createObject (dbName, collectionName, o, principal);
		}
	}
	private BasicDBObject createObject (String dbName, String collectionName, BasicDBObject o, Principal principal) {
		DB db = mongoClient.getDB(dbName);
		DBCollection coll = db.getCollection(collectionName);
		logger.debug("*******createObject ********orignal******" + o);
		
		o.remove("_id");
		o.append("principal", principal.getName());
		
		coll.insert(o);
		String _id = o.getString("_id");
		logger.debug("*******save createObject insert o _id**************" + _id); 
		o.put("_id", _id);
		
		return Utilities.wrap(o, true, "Data saved successfully");
	}
	private BasicDBObject updateObject (String dbName, String collectionName, BasicDBObject o, Principal principal) {
		DB db = mongoClient.getDB(dbName);
		DBCollection coll = db.getCollection(collectionName);
		//logger.debug("*******updateObject ********orignal******" + o);
		BasicDBObject q = new BasicDBObject();
		
		String _id = o.getString("_id");
		q.put("_id", new ObjectId(_id));
		
		o.remove("_id");
		o.append("principal", principal.getName());

		coll.update(q, o);
		logger.debug("*******updateObject update o _id**************" + _id); 
		o.put("_id", _id);
		
		return Utilities.wrap(o, true, "Data saved successfully");
	}
    private BasicDBObject findPrincipalUser(Principal principal) throws UsernameNotFoundException {
		logger.debug("*****loadUserByUsername***username****" + principal.getName()); 
		
		DB db = mongoClient.getDB(Constance.ACCOUNT_DB_NAME);
		DBCollection coll = db.getCollection("users");
		
		BasicDBObject query = new BasicDBObject("email", principal.getName());
		
	    logger.debug("******loadUserByUsername*******query*******" + query); 
	    BasicDBObject u = (BasicDBObject) coll.findOne(query);
		
		if (u != null){
			logger.debug("**loadUserByUsername _id*****u _id****" + u.getString("_id")); 
			u.put("_id", u.getString("_id"));
		}

	    logger.debug("******findPrincipalUser*******u*******" + u); 
        return u;
    }
    
	private BasicDBObject defaultObject(String dbName, String collectionName, String _id, Principal principal){
		if (collectionName.equals(Constance.ACCOUNT_WORKSPACE_COLLECTION)){
			logger.debug("******loadUserByUsername*******defaultObject*******"); 
			return findDefaultWorkspace(dbName, collectionName, _id, principal);
		}
		return Utilities.wrap(new BasicDBObject(), false, "No supported default object");
	}
	private BasicDBObject findDefaultWorkspace(String dbName, String collectionName, String _id, Principal principal) {  
    	if (principal != null){
    		// find the user default workspace, if no user defaults, then give common default workspace
			logger.debug("*******findDefaultWorkspace*******"); 
			String _defaultId = "default";
			String code = Constance.DEFAULT_WORKSPACE_CODE;
			String name = Constance.DEFAULT_WORKSPACE_NAME;
			String role = "admin";
			
			DB db = mongoClient.getDB(Constance.ACCOUNT_DB_NAME);
			DBCollection coll = db.getCollection(Constance.ACCOUNT_WORKSPACE_COLLECTION);
			BasicDBObject r = null;
			
			BasicDBObject u = findPrincipalUser(principal);
			String uDefaultWsId = u.getString("defaultSpaceId");
			logger.debug("*******findDefaultWorkspace****user has user uDefaultWsId***" + uDefaultWsId); 
			if (uDefaultWsId != null && uDefaultWsId.length() > 0){
				_defaultId = uDefaultWsId;
				
				BasicDBObject q = new BasicDBObject().append("paid", true)
						.append("expiry", new BasicDBObject("$gt", (new java.util.Date()).getTime()));
				q.put("_id", new ObjectId(uDefaultWsId));
				r = (BasicDBObject) findWorkspace(q, principal).get("data");
				logger.debug("*******findDefaultWorkspace****user has user level ws***"); 
			}else{
				BasicDBObject q = new BasicDBObject("default", true).append("paid", true)
						.append("expiry", new BasicDBObject("$gt", (new java.util.Date()).getTime()));
				
				//should add expiry
	
				DBObject clause1 = new BasicDBObject("members.email", principal.getName());  
				DBObject clause2 = new BasicDBObject("principal", principal.getName());    
				BasicDBList or = new BasicDBList();
				or.add(clause1);
				or.add(clause2);
				q.append("$or", or);
				
			    logger.debug("*******findDefaultWorkspace*******q*******" + q); 
		    	r = (BasicDBObject) coll.findOne(q);
			    if (r != null){
					_defaultId = r.getString("_id");
					r.put("_id", _defaultId);
					logger.debug("*******findDefaultWorkspace****found space level level ws***"); 
			    }
			}
			
			if (r != null){
				logger.debug("*******findDefaultWorkspace _id*******r _id*******" + r.getString("_id")); 
				
				code = r.getString("code");
				name = r.getString("name");
				logger.debug("*******findDefaultWorkspace _id*******r code*******" + code); 
				logger.debug("*******findDefaultWorkspace _id*******r name*******" + name); 
				logger.debug("*******listWorkspaces*******r***code****" + code); 
				logger.debug("*******listWorkspaces*******r***principal****" + r.getString("principal")); 
				//////////
				String ur = getUserSpaceRole(r, principal);
				if (ur != null){
					role = ur;
				}
				//////////
				
			}else{
				logger.debug("*******findDefaultWorkspace****no space for user, use default***"); 
			}
			if (principal.getName().equals("sys@iontask.com")){
				role = "admin";
			}
			
			BasicDBObject ws = Utilities.wrap(Utilities.createDefaultWorkspace(_defaultId, code, name, role, u.getString("name")), true, "Workspace retrieved successfully");
			//logger.debug("*******findDefaultWorkspace****ws***" + ws); 
    		return ws;
    	}else{
    		return Utilities.wrap(new BasicDBObject("uid", ""), false, "Not authorized");
    	}
	}
	private String getUserSpaceRole(BasicDBObject r, Principal principal){
		if (principal.getName().equals("sys@iontask.com")){
			return "admin";
		}
		String role = null;
		String code = r.getString("code");
		if (principal.getName().equals(r.getString("principal"))){
			role = "admin";
		}else{
			logger.debug("*******listWorkspaces*******r***try to find member****"); 
			BasicDBObject mq = new BasicDBObject("email", principal.getName());
			DB dbMember = mongoClient.getDB(code);
			DBCollection collMember = dbMember.getCollection("members");
			
		    BasicDBObject member = (BasicDBObject) collMember.findOne(mq);
			
			if (member != null){
				logger.debug("*******find _id*******r _id*******" + r.getString("_id")); 
				member.put("_id", member.getString("_id"));
				role = member.getString("role");
			}else{
				role = "no";
			}
			logger.debug("*******listWorkspaces*******r***find role****" + role); 
		}
		return role;
	}
	private BasicDBObject emptyObject(String dbName, String collectionName, String _id, Principal principal){
		if (collectionName.equals("projects")){
			return emptyProject(dbName, collectionName, _id, principal);
		}
		return Utilities.wrap(new BasicDBObject(), false, "No supported empty object");
	}
    
	private BasicDBObject emptyProject(String dbName, String collectionName, String _id, Principal principal){
		if (collectionName.equals("projects")){
			
			logger.debug("*****emptyObject*******projects*******"); 
			
			BasicDBObject proj = new BasicDBObject("code", "NEW");
			proj.append("name", "New Project");
			proj.append("canWrite", true);
			proj.append("canWriteOnParent", true);
			proj.append("splitterPosition", 67);
			proj.append("zoom", "m");
			proj.append("selectedRow", 0);
			
			BasicDBObject task = new BasicDBObject("id", 1);
			task.append("name", "New Project" );
			task.append("progress", 0);
			task.append("description", "New Project" );
			task.append("code", "NEW" );
			task.append("level", 0 );
			task.append("status", "STATUS_ACTIVE" );
			task.append("depends", "" );
			task.append("canWrite", true );
			task.append("start", (new java.util.Date()).getTime() );
			task.append("duration", 1 );
			task.append("end", (new java.util.Date()).getTime() + 60 * 60 + 24 );
			task.append("startIsMilestone", false );
			task.append("endIsMilestone", false );
			task.append("collapsed", false );
			task.append("hasChild", true );

			logger.debug("*****emptyObject*******projects******task*"); 
			
			BasicDBList tasks = new BasicDBList();
			tasks.add(task);
			
			proj.append("tasks", tasks);
			
			BasicDBObject queryRole = new BasicDBObject("status", "ACTIVE");
			
			//BasicDBObject roles = listObjects(dbName, "roles", queryRole, null, principal);//no reason to have role
			// in project, at project level, pm and member enough, and task level, no reason to have role
			//project level, even if user can create role, but useless as it has no function to new role created
			
			//if (roles != null && roles.size() > 0){
			//	logger.debug("*****emptyObject*******projects******roles*"); 
			//	proj.append("roles", roles.get("data"));
			//}
						
			BasicDBObject u = findPrincipalUser(principal);
			logger.debug("*****emptyObject*******projects******u*" + u.getString("_id")); 

			// but at project level, PM or member is important to decide if user can edit the plan, so add default PM
			u.put("role", new BasicDBObject("id", "PM").append("name", "Project Manager"));
			BasicDBList res = new BasicDBList();
			res.add(u);
			proj.append("resources", res);
			logger.debug("*****emptyObject*******projects******res*"); 
			
			return Utilities.wrap(proj, false, "New Project Created Successfully");
		}else{
			return Utilities.wrap(new BasicDBObject("_id", _id), false, "Unkown Object requested");
		}
	}
	public BasicDBObject requestPayment(BasicDBObject r, String returnURL, String access_token, Principal principal) throws Exception {
		DecimalFormat df = new DecimalFormat("0.00");
		
		List<Item> items = new ArrayList<Item>();
		
		int term = Integer.parseInt(r.getString("term"));
		int maxmsAdd = Integer.parseInt(r.getString("maxms"));
		logger.debug("****requestPayment*******term: " + term + "  maxmsAdd: " + maxmsAdd);
		r.put("term", term);
		r.put("maxmsadd", maxmsAdd);
		r.put("maxms", 0);
		
		double baseAmount = Utilities.getSpacePrices(term);
		double baseMembersAmount = Utilities.getMembersPrices(maxmsAdd) * maxmsAdd * term;
		double existingMemberRenew = 0;
		double addMembersExistTerm = 0;
		
		Item item = null;
		if (term > 0){
			item = new Item();
			item.setName("Workspace " + r.getString("name") + " " + r.getString("termDescription")).setQuantity("1").setCurrency("USD").setPrice(df.format(baseAmount));
			items.add(item);
		}
		
		if (baseMembersAmount > 0){
			item = new Item();
			item.setName("Add " + maxmsAdd  + " members for new term " + term + " months").setQuantity("1").setCurrency("USD").setPrice(df.format(baseMembersAmount));
			items.add(item);
		}
		
		String _id = r.getString("_id");
		logger.debug("****requestPayment*******_id*******" + _id);
		if (_id != null && _id.length() > 0){
			BasicDBObject q = new BasicDBObject();
			q.put("_id", new ObjectId(_id));
			
			BasicDBObject e = findObject(Constance.ACCOUNT_DB_NAME, Constance.ACCOUNT_WORKSPACE_COLLECTION, q, principal);
			
			BasicDBObject eo = (BasicDBObject) e.get("data");
			eo.put("name", r.getString("name"));
			eo.put("default", r.getBoolean("default"));
			eo.put("origin", r.getString("origin"));
			eo.put("termDescription", r.getString("termDescription"));
			eo.put("default", r.getBoolean("default"));
			
			eo.put("term", term);
			eo.put("maxmsadd", maxmsAdd);
			
			if (eo.getBoolean("paid")){
				int existsMaxms = eo.getInt("maxms");
				
				existingMemberRenew = Utilities.getMembersPrices(existsMaxms) * existsMaxms * term;
				if (existingMemberRenew > 0){
					item = new Item();
					item.setName("Existing " + existsMaxms + " members for new term " + term + " months").setQuantity("1").setCurrency("USD").setPrice(df.format(existingMemberRenew));
					items.add(item);
				}
				
				//if (maxms > existsMaxms){
					//extend members size
					//how long the valid time left
					Calendar cal = Calendar.getInstance(); 
					long today = cal.getTimeInMillis();
					logger.debug("*******requestPayment today**************" + cal.getTime()); 
					
					long originalExpiry = eo.getLong("expiry");
					if (originalExpiry > today) {
						Calendar cal2 = Calendar.getInstance(); 
						cal2.setTimeInMillis(originalExpiry);
						logger.debug("*******executePayment originalExpiry**************" + cal2); 
						int diffYear = cal2.get(Calendar.YEAR) - cal.get(Calendar.YEAR);
						int diffMonth = diffYear * 12 + cal2.get(Calendar.MONTH) - cal.get(Calendar.MONTH); 
						logger.debug("*******executePayment diffMonth**************" + diffMonth); 
												
						addMembersExistTerm = Utilities.getMembersPrices(maxmsAdd) * maxmsAdd * diffMonth;
						
						if (maxmsAdd > 0){
							item = new Item();
							item.setName("Add " + maxmsAdd + " members for existing term " + diffMonth + " months").setQuantity("1").setCurrency("USD").setPrice(df.format(addMembersExistTerm));
							items.add(item);
						}
					}
					
				//}
			}
			
			r = eo;

			logger.debug("****createPayment*******try to update*****r**");
			updateObject (Constance.ACCOUNT_DB_NAME, Constance.ACCOUNT_WORKSPACE_COLLECTION, r, principal);
		}else{
			if (r.getString("code").equals(Constance.DEFAULT_WORKSPACE_CODE)){
				return Utilities.wrap(r, false, Constance.ERROR_WORKSPACE_EXISTS, "Workspace code exists");
			}
			
			r.append("paid", false);
			
			//check if the code exists
			BasicDBObject q = new BasicDBObject();
			q.put("code", r.getString("code"));
			
			BasicDBObject e = findObject(Constance.ACCOUNT_DB_NAME, Constance.ACCOUNT_WORKSPACE_COLLECTION, q, principal);
			if (e.getBoolean("success")){
				return Utilities.wrap(r, false, Constance.ERROR_WORKSPACE_EXISTS, "Workspace code exists");
			}
			//save the space in mongo and send to payment
			logger.debug("****createPayment*******try to create new*****r**");
			createObject (Constance.ACCOUNT_DB_NAME, Constance.ACCOUNT_WORKSPACE_COLLECTION, r, principal);
		}
		
		double amountDouble = baseAmount + baseMembersAmount + existingMemberRenew + addMembersExistTerm;
		double taxDouble = Utilities.getTaxRate() * amountDouble;
		double totalDouble = amountDouble + taxDouble;
		
		r.append("amount", amountDouble);
		r.append("tax", taxDouble);
		r.append("total", totalDouble);
		
		logger.debug("****createPayment******returnURL*******" + returnURL); 
		//BasicDBObject payment = createPayment(access_token, principal, r, returnURL, r.getString("origin"));
		//logger.debug("****createPayment******payment***id****" + payment); 
		InputStream is = APIService.class.getResourceAsStream("/sdk_config.properties");
		OAuthTokenCredential tokenCredential = Payment.initConfig(is);
	    String accessToken = tokenCredential.getAccessToken();
	    APIContext apiContext = new APIContext(accessToken);
		
		String amountStr = df.format(amountDouble);
		String taxStr = df.format(taxDouble);
		String totalStr = df.format(totalDouble);
		logger.debug("****requestPayment***amountSt: " + amountStr + " taxStr: " + taxStr + " totalStr: " + totalStr);
		
		// Let's you specify details of a payment amount.
		Details details = new Details();
		details.setShipping("0");
		details.setSubtotal(amountStr);
		details.setTax(taxStr);

		// ###Amount
		// Let's you specify a payment amount.
		Amount amount = new Amount();
		amount.setCurrency("USD");
		// Total must be equal to sum of shipping, tax and subtotal.
		amount.setTotal(totalStr);
		amount.setDetails(details);

		// ###Transaction
		// A transaction defines the contract of a
		// payment - what is the payment for and who
		// is fulfilling it. Transaction is created with
		// a `Payee` and `Amount` types
		Transaction transaction = new Transaction();
		transaction.setAmount(amount);
		transaction
				.setDescription("Payment for " + r.getString("name") + " " + r.getString("termDescription"));

		// ### Items
		
		ItemList itemList = new ItemList();
		
		itemList.setItems(items);
		
		transaction.setItemList(itemList);
				
		// The Payment creation API requires a list of
		// Transaction; add the created `Transaction`
		// to a List
		List<Transaction> transactions = new ArrayList<Transaction>();
		transactions.add(transaction);

		// ###Payer
		// A resource representing a Payer that funds a payment
		// Payment Method
		// as 'paypal'
		Payer payer = new Payer();
		payer.setPaymentMethod("paypal");

		// ###Payment
		// A Payment Resource; create one using
		// the above types and intent as 'sale'
		Payment payment = new Payment();
		payment.setIntent("sale");
		payment.setPayer(payer);
		payment.setTransactions(transactions);
	    
		// ###Redirect URLs
		RedirectUrls redirectUrls = new RedirectUrls();
		String guid = UUID.randomUUID().toString().replaceAll("-", "");
		_id = r.getString("_id");
		String code = r.getString("code");
		
		String paidURL = returnURL + "/paypal/" + code + "?access_token=" + access_token + "&_id=" + _id + "&guid=" + guid + "&origin=" + r.getString("origin");
		String cancelURL = returnURL + "/paypal/" + code + "?access_token=" + access_token + "&_id=" + _id + "&cancel=yes" + "&origin=" + r.getString("origin");
		logger.debug("****createPayment******paidURL*******" + paidURL); 
		logger.debug("****createPayment******cancelURL*******" + cancelURL); 
		redirectUrls.setCancelUrl(cancelURL);
		redirectUrls.setReturnUrl(paidURL);
		
		payment.setRedirectUrls(redirectUrls);
		
		Payment createdPayment = payment.create(apiContext);
		logger.info("-----------Created payment with id = "
				+ createdPayment.getId() + " and status = "
				+ createdPayment.getState());
		
		r.put("paymentId", createdPayment.getId());
		updateObject (Constance.ACCOUNT_DB_NAME, Constance.ACCOUNT_WORKSPACE_COLLECTION, r, principal);
		
		BasicDBObject o = new BasicDBObject();
		
		Iterator<Links> links = createdPayment.getLinks().iterator();
		while (links.hasNext()) {
			Links link = links.next();
			if (link.getRel().equalsIgnoreCase("approval_url")) {
				o.append("approvalURL", link.getHref());
				break;
			}
		}
		
		o.append(guid, createdPayment.getId());
		o.append("lastRequest", Payment.getLastRequest());
		o.append("lastResponse", Payment.getLastResponse());
		
		return Utilities.wrap(o, true, "Data returned normally");
	}
	
	public BasicDBObject executePayment(String _id, String paymentId, String PayerID, Principal principal) throws Exception{
		BasicDBObject o = new BasicDBObject();
		
		InputStream is = APIService.class.getResourceAsStream("/sdk_config.properties");
		
		OAuthTokenCredential tokenCredential = Payment.initConfig(is);
		
	    String accessToken = tokenCredential.getAccessToken();
	    
	    APIContext apiContext = new APIContext(accessToken);
	    
		Payment payment = new Payment();
		Payment createdPayment = null;
		if (paymentId != null) {
			payment.setId(paymentId);
		}
		PaymentExecution paymentExecution = new PaymentExecution();
		if (PayerID != null) {
			paymentExecution.setPayerId(PayerID);
		}

		try {
			createdPayment = payment.execute(apiContext, paymentExecution);
			String executedPaymentId = createdPayment.getId();
			logger.debug("*******executePayment payment execute*******id*******" + executedPaymentId); 
			
			BasicDBObject jsonPayment = (BasicDBObject) JSON.parse(createdPayment.toJSON());
			
			if (createdPayment.getState().equals("approved")){
				
				DB db = mongoClient.getDB(Constance.ACCOUNT_DB_NAME);
				DBCollection coll = db.getCollection(Constance.ACCOUNT_WORKSPACE_COLLECTION);
				
				BasicDBObject q = new BasicDBObject();
				q.put("_id", new ObjectId(_id));
				q.append("paymentId", executedPaymentId);
				
				BasicDBObject r = (BasicDBObject) coll.findOne(q);
				logger.debug("*******executePayment find r**************"); 

				////////////////save payments
				DB dbNew = mongoClient.getDB(r.getString("code"));
				DBCollection payColl = dbNew.getCollection(Constance.ACCOUNT_PAYMENTS_COLLECTION);
				
				jsonPayment.remove("_id");
				jsonPayment.append("spaceId", _id);
				jsonPayment.append("principal", principal.getName());
				
				payColl.insert(jsonPayment);
				String _idPayment = jsonPayment.getString("_id");
				
				jsonPayment.put("_id", _idPayment);
				////////////////////////////////
				
				BasicDBList pays = (BasicDBList) r.get("payments");
				if (pays == null){
					pays = new BasicDBList();
				}
				pays.add(jsonPayment);
				
				r.put("payments", pays);

				q = new BasicDBObject();
				q.put("_id", new ObjectId(_id));
				r.remove("_id");

				int m = r.getInt("term");
				if (m > 0){
					Calendar cal = Calendar.getInstance(); 
					long expiry = cal.getTimeInMillis();
					logger.debug("*******executePayment today**************" + cal.getTime()); 
					if (r.getBoolean("paid")){
						long originalExpiry = r.getLong("expiry");
						if (originalExpiry > expiry) {
							cal.setTimeInMillis(originalExpiry);
							logger.debug("*******executePayment originalExpiry**************" + cal.getTime()); 
						}
					}
									
					cal.add(Calendar.MONTH, m);
					logger.debug("*******executePayment new Expiry**************" + cal.getTime()); 
					
					expiry = cal.getTimeInMillis();
					
					r.put("expiry", expiry);
				}
				
				r.put("paid", true);
				r.put("active", true);
				
				int maxms = r.getInt("maxms");
				int maxmsadd = r.getInt("maxmsadd");
				
				if (maxmsadd > 0) {
					maxms += maxmsadd;
					r.put("maxms", maxms);
				}
				
				coll.update(q, r);
				r.put("_id", _id);
				
				logger.debug("*******executePayment update o _id**************" + r.getString("_id")); 
				
				o.append("success", true);
				o.append("payment", r);
				
				if (r.getBoolean("default")){
					String _wsId = r.getString("_id");

				    logger.debug("******setDefaultWorkspace*******_wsId*******" + _wsId); 
					
					BasicDBObject u = findPrincipalUser(principal);
					u.put("defaultSpaceId", _wsId);
					
					updateObject (Constance.ACCOUNT_DB_NAME, "users", u, principal);
				}
				logger.debug("*******executePayment done**************"); 
			}

			logger.info("Created payment with id = " + createdPayment.getId()
					+ " and status = " + createdPayment.getState());
			
			return o;
			
		} catch (PayPalRESTException e) {
			o.append("success", false);
			o.append("error", e.getMessage());
			o.append("lastRequest", Payment.getLastRequest());
			
			return o;
		}
	}
	private void sendEmail(String from, String to, String subject, String msg){
		SimpleMailMessage message = new SimpleMailMessage();
		 
		message.setFrom(from);
		message.setTo(to);
		message.setSubject(subject);
		message.setText(msg);
		mailSender.send(message);
	}
}
