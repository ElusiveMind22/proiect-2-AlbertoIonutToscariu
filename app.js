const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')
const cookieParser=require('cookie-parser');
const app = express();
app.use(cookieParser());
const port = 6789;
const fs=require("fs");
var session = require('express-session');
app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true,
	cookie: {secure: false}
  }));
  var db;
  const sqlite3 = require('sqlite3').verbose();
 
  const path = 'cumparaturi.db';

const { render } = require('ejs');
// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');
// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views/layout.ejs
app.use(expressLayouts);
// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'))
// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());
// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));

// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
app.get('/', (req, res) => {
	res.render('index', {fullname: req.session.FULLNAME, username: req.session.USERNAME,rows:req.session.myRows});

} );
app.get('/autentificare', (req, res) => res.render('autentificare.ejs', {error: req.cookies.errorCookie}));

// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată
let listaIntrebari;
app.get('/chestionar', (req, res) => {
	fs.readFile('intrebari.json',(err,data)=>{
		if(err) throw err;
		listaIntrebari=JSON.parse(data).listaIntrebari;
		res.render('chestionar', {intrebari: listaIntrebari,fullname: req.session.FULLNAME, username: req.session.USERNAME});
	})
});

app.post('/rezultat-chestionar', (req, res) => {
	let raspunsuri = req.body;
	fs.readFile('intrebari.json',(err,data)=>{
		if(err) throw err;
		listaIntrebari = JSON.parse(data).listaIntrebari;
		res.render("rezultat-chestionar",{intrebari : listaIntrebari,rasp: raspunsuri});
	
	})
});

let users;

app.get('/autentificare', (req, res) => {
	res.render('autentificare', {error: req.cookies.errorCookie});
} );
app.get('/vizualizare-cos', (req, res) => {
	res.render('vizualizare-cos',{fullname: req.session.FULLNAME, username: req.session.USERNAME});
} );

app.post('/verificare-autentificare', (req, res) => {

	fs.readFile('users.json', (err, data) => {
		if (err) throw err;

		users = JSON.parse(data).users;
		let input = req.body;
		let flag=0;
		console.log(users[1].username);
		for(let i=0;i<3;i++)
		{
			if (input.Username == users[i].username && input.Password == users[i].password)
				{
					console.log(users[i].fullname);
					flag=1;
					req.session.FULLNAME = users[i].fullname;
					req.session.USERNAME = users[i].username;
		
					res.redirect("/");
					break;
				}
		}
		if(flag==0)
		{
			res.cookie("errorCookie", "Name or password not corresponding!", {expires: new Date(Date.now() + 2000)}); 
			res.redirect("/autentificare");
		}
	})
});

app.get('/deconectare', (req, res) => {
	req.session.FULLNAME = null;
	req.session.USERNAME = null;
	res.redirect("/");
});

app.post('/creare-db', (req, res) => {
	db = new sqlite3.Database('cumparaturi.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
		if (err)
			console.error(err.message);
	});

	db.run('CREATE TABLE produse(ID int, Nume_Produs varchar(20), Cantitate int, Pret double(3, 2))');
	res.redirect('/');
	
});

app.post('/inserare-db', (req, res) => {
	db.run('INSERT INTO produse VALUES(?,?,?,?)', ['1', "Ghiocei", "150", '0.75'], function(err) {
		if (err) 
		  return console.log(err.message);``
	  });
	  db.run('INSERT INTO produse VALUES(?,?,?,?)', ['2', "Trandafiri", "100", '5.70'], function(err) {
		if (err) 
		  return console.log(err.message);
	  });
	  db.run('INSERT INTO produse VALUES(?,?,?,?)', ['3', "Margarete", "200", '1.00'], function(err) {
		if (err) 
		  return console.log(err.message);
	  });
	  db.run('INSERT INTO produse VALUES(?,?,?,?)', ['4', "Violete", "50", '3.00'], function(err) {
		if (err) 
		  return console.log(err.message);
	  });
	  db.run('INSERT INTO produse VALUES(?,?,?,?)', ['5', "Busuioaca", "25", '4.50'], function(err) {
		if (err) 
		  return console.log(err.message);
	  });
	
	let sql = 'SELECT * FROM produse ';
	let i = 0;
	req.session.myRows=[];
	
	setTimeout(function(){
		db.all(sql, [], (err, rows) => {
			if (err) 
					throw err;
			rows.forEach((row) => {
				req.session.myRows[i] = [row.ID, row.Nume_Produs, row.Cantitate, row.Pret];
				i++;
				});
			console.table(req.session.myRows);
			res.redirect('/');
		});
	}, 1500);
	

});


app.post('/inchide-db', (req, res) => {

	fs.unlink(path, (err) => {
		if (err) {
		  console.error(err)
		  return
		}
	});
	res.redirect("/");
});

app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost: 6789`));	