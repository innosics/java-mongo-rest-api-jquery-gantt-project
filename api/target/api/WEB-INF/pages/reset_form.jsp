<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<html>
<body>
	<h2>Account reset</h2> 
	<p>${msg}</p>
	<p>
		<form action="${action}" method="POST">
			<input id="_id" name="_id" type="hidden" value="${_id}"/>
			<input id="origin" name="origin" type="hidden" value="${origin}"/>
			Password: <input id="password" name="password" type="password"/>
			Re-enter Password: <input id="password2" name="password2" type="password"/>
			<p><input id="submit" name="submit" type="submit" value="Submit" /></p>
		</form>
	</p>
</body>
</html> 
