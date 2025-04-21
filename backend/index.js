// Gerekli modüllerin yüklenmesi
const mongoose = require("mongoose");    // MongoDB veritabanı bağlantısı için
const express = require("express");      // Web sunucusu oluşturmak için
const app = express();                   // Express uygulaması başlatılması
const {v4:uuidv4} = require("uuid");     // Benzersiz ID'ler oluşturmak için
const multer = require("multer");        // Dosya yükleme işlemleri için
const cors = require("cors");            // Cross-Origin isteklerine izin vermek için
const jwt = require("jsonwebtoken")      // Kimlik doğrulama token'ları için
const path = require("path");            // Dosya yolları işlemleri için

// Middleware ayarları
app.use(cors());                         // CORS politikasını etkinleştir
app.use(express.json());                 // JSON verilerini işlemek için
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // resime erişmesi için.

// MongoDB veritabanı bağlantısı
const uri = "mongodb+srv://seyma:seyma@reacteticaretdb.dq0iewi.mongodb.net/"
mongoose.connect(uri).then(res=>{
    console.log("Database bağlantısı başarılı");
}).catch(err=>{
    console.log(err.message)
});

//VERİTABANI ŞEMALARı

//User Collection - Kullanıcı bilgilerini saklar
const userSchema = new mongoose.Schema({
    _id: String,               
    name: String,              
    email: String,            
    password: String,         
    isAdmin: Boolean          
});

const User = mongoose.model("User", userSchema);

//Product Collection - Ürün bilgilerini saklar
const productSchema = new mongoose.Schema({
    _id: String,               
    name: String,             
    stock: Number,             
    price: Number,             
    imageUrl: String,         
    categoryName: String       
});

const Product = mongoose.model("Product", productSchema);

//Basket Collection - Sepet bilgilerini saklar
const basketSchema = new mongoose.Schema({
    _id: String,               
    productId: String,     
    userId: String,            
});

const Basket = mongoose.model("Basket", basketSchema);

//Order Collection - Sipariş bilgilerini saklar
const orderSchema = new mongoose.Schema({
    _id: String,              
    productId: String,         
    userId: String,            
})

const Order = mongoose.model("Order", orderSchema);

//TOKEN AYARLARI 

const secretKey = "Gizli anahtarım Gizli anahtarım Gizli anahtarım"; // JWT için gizli anahtar
const options = {
    expiresIn: "1h"           // Token geçerlilik süresi: 1 saat
};



// Register işlemi : Yeni kullanıcı kaydı oluşturma
app.post("/auth/register", async (req, res)=>{
    try {
        // İstek gövdesinden kullanıcı bilgilerini al
        const {name, email, password} = req.body;
        
        // Yeni kullanıcı nesnesi oluştur
        let user = new User({
            _id: uuidv4(),         
            name: name,             
            email: email,           
            password: password,     
            isAdmin: false         
        });

        // Kullanıcıyı veritabanına kaydet
        await user.save();
        
        // JWT token oluştur
        const payload = {
            user: user
        }
        const token = jwt.sign(payload, secretKey, options);
        
        // Kullanıcı bilgilerini ve token'ı döndür
        res.json({user: user, token: token})
    } catch (error) {
        // Hata durumunda 500 kodu ile hatayı döndür
        res.status(500).json({error: error.message})
    }
});




// Kullanıcı girişi (login) işlemi
app.post("/auth/login", async (req, res)=>{
    try {
        // İstek gövdesinden kullanıcı bilgilerini al
        const {email, password} = req.body;
        
        // E-posta ve şifre ile eşleşen kullanıcıyı bul
        const users = await User.find({email: email, password: password});
        
        if(users.length == 0){
            // Kullanıcı bulunamadı, hata mesajı döndür
            res.status(500).json({message: "Mail adresi ya da şifre yanlış!"});
        }else{
            // Kullanıcı bulundu, JWT token oluştur
            const payload = {
                user: users[0]
            }
            const token = jwt.sign(payload, secretKey, options);
            
            // Kullanıcı bilgilerini ve token'ı döndür
            res.json({user: users[0], token: token})
        }
    } catch (error) {
        // Hata durumunda 500 kodu ile hatayı döndür
        res.status(500).json({message: error.message});
    }
});





// Tüm ürünleri listele
app.get("/products", async (req, res) => {
    try {
        // Tüm ürünleri isme göre sıralayarak getir
        const products = await Product.find({}).sort({name: 1});
        
        // Ürün listesini JSON olarak döndür
        res.json(products);
    } catch (error) {
        // Hata durumunda 500 kodu ile hatayı döndür
        res.status(500).json({message: error.message});
    }
})

// Dosya yükleme ayarları
const storage = multer.diskStorage({
    // Dosyanın kaydedileceği klasör
    destination: function(req, file, cb) {
        cb(null, "uploads/")
    },
    // Dosya adı oluşturma (benzersiz olması için timestamp ekleniyor)
    filename: function(req, file, cb){
        cb(null, Date.now() + "-" + file.originalname) 
    }
});

// Multer yükleme nesnesini oluştur
const upload = multer({storage: storage});




// Yeni ürün ekleme
app.post("/products/add", upload.single("image"), async (req, res)=>{
    try {
        // İstek gövdesinden ürün bilgilerini al
        const {name, categoryName, stock, price} = req.body;
        
        // Yeni ürün nesnesi oluştur
        const product = new Product({
            _id : uuidv4(),             
            name: name,                  
            stock: stock,            
            price: price,                
            categoryName: categoryName,  
            imageUrl: req.file.path     
        });

        // Ürünü veritabanına kaydet
        await product.save();
        
        // Başarılı mesajı döndür
        res.json({message: "Ürün kaydı başarıyla tamamlandı!"});
    } catch (error) {
        // Hata durumunda 500 kodu ile hatayı döndür
        res.status(500).json({message: error.message});
    }
});

// Ürün silme
app.post("/products/remove", async (req, res)=>{ //required ve respone u yakalayalım.
    try {
        // İstek gövdesinden ürün ID'sini al
        const {_id} = req.body;
        
        // Ürünü ID'ye göre bul ve sil
        await Product.findByIdAndRemove(_id);
        
        // Başarılı mesajı döndür
        res.json({message: "Silme işlemi başarıyla gerçekleşti"});
    } catch (error) {
        // Hata durumunda 500 kodu ile hatayı döndür
        res.status(500).json({message: error.message});
    }
})





// Sepete ürün ekleme
app.post("/baskets/add", async (req,res)=>{
    try {
        // İstek gövdesinden ürün ve kullanıcı ID'lerini al
        const {productId, userId} = req.body;  //ürün id ve userid yakalyalım
        
        // Yeni sepet oluştur
        let basket = new Basket({ 
            _id: uuidv4(),             
            userId: userId,           
            productId: productId      
        });

        await basket.save();

        // Ürünün stok miktarını güncelle (bir adet azalt)
        let product = await Product.findById(productId); //ürünü bul.
        product.stock = product.stock - 1;
        await Product.findByIdAndUpdate(productId, product); //update edelim.

       
        res.json({message: "Ürün sepete başarıyla eklendi"});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
})

// Kullanıcının sepetindeki ürünleri getirme
app.post("/baskets/getAll", async(req, res)=>{
    try {
        //kullanıcı ID'sini alalım.
        const {userId} = req.body;
        
        // Sepet ve ürün bilgilerini birleştirerek sorgula (MongoDB aggregation)
        const baskets = await Basket.aggregate([  
            {
                // Kullanıcı ID'sine göre filtrele
                $match: {userId: userId}
            },
            {
                // Ürün bilgilerini birleştir (join işlemi)
                $lookup:{
                    from: "products",          
                    localField: "productId",    
                    foreignField: "_id",         
                    as: "products"           
                  }
            }
        ]);

        // Sepet listesini JSON olarak döndür
        res.json(baskets);
    } catch (error) {
        // Hata durumunda 500 kodu ile hatayı döndür
        res.status(500).json({message: error.message});
    }
})

// Sepetten ürün silme
app.post("/baskets/remove", async(req,res)=>{
    try {
        // İstek gövdesinden sepet öğesi ID'sini al
        const {_id} = req.body;
        
        // Sepet öğesini bul (findById yerine findOne kullanarak)
        const basket = await Basket.findOne({_id: _id});
        
        if (!basket) {
            return res.status(404).json({message: "Sepet öğesi bulunamadı"});
        }
        
        // İlgili ürünü bul ve stok miktarını artır
        const product = await Product.findOne({_id: basket.productId});
        
        if (product) {
            product.stock += 1;
            await Product.updateOne({_id: product._id}, product);
        }
        
        // Sepet öğesini sil (findByIdAndRemove yerine deleteOne kullanarak)
        await Basket.deleteOne({_id: _id});
        
        // Başarılı mesajı döndür
        res.json({message: "Silme işlemi başarılı"});
    } catch (error) {
        console.error("Sepet silme hatası:", error);
        // Hata durumunda 500 kodu ile hatayı döndür
        res.status(500).json({message: error.message});
    }
})





// Kullanıcının siparişlerini getirme
app.post("/orders", async(req, res)=>{
    try {
        // İstek gövdesinden kullanıcı ID'sini al
        const {userId} = req.body;
        
        // Sipariş ve ürün bilgilerini birleştirerek sorgula (MongoDB aggregation)
        const orders = await Order.aggregate([
            {
                // Kullanıcı ID'sine göre filtrele
                $match: {userId: userId}
            },
            {
                // Ürün bilgilerini birleştir (join işlemi)
                $lookup:{
                    from: "products",          
                    localField: "productId",    
                    foreignField: "_id",       
                    as: "products"              
                }
            }
        ]);

        // Sipariş listesini JSON olarak döndür
        res.json(orders);
    } catch (error) {
        // Hata durumunda 500 kodu ile hatayı döndür
        res.status(500).json({message: error.message});
    }
})







app.post("/orders/add", async (req, res)=>{
    try {
        // İstek gövdesinden kullanıcı ID'sini al
        const {userId} = req.body;
        console.log("Sipariş oluşturuluyor, userId:", userId);
        
        if (!userId) {
            return res.status(400).json({message: "Kullanıcı kimliği gereklidir"});
        }
        
        // Kullanıcının sepetindeki tüm ürünleri getir
        const baskets = await Basket.find({userId: userId});
        console.log("Sepetteki ürün sayısı:", baskets.length);
        
        if (baskets.length === 0) {
            return res.status(400).json({message: "Sepetinizde ürün bulunmamaktadır"});
        }
        
        const siparisler = [];
        
        // Her sepet öğesi için sipariş oluştur
        for(const basket of baskets){
            try {
                console.log("Sipariş oluşturuluyor - Sepet ID:", basket._id);
                
                // Yeni sipariş nesnesi oluştur
                let order = new Order({
                    _id: uuidv4(),             
                    productId: basket.productId, 
                    userId: userId             
                });
                
                // Siparişi kaydet
                await order.save();
                siparisler.push(order);
                
                // Sepet öğesini sil
                const silmeIslemi = await Basket.deleteOne({_id: basket._id});
                console.log("Sepet silme sonucu:", silmeIslemi);
                
            } catch (sepetHatasi) {
                console.error("Sepet işleme hatası:", sepetHatasi);
                // Burada hatayı günlüğe kaydediyoruz ama işlemi durdurmuyoruz
                // Böylece diğer sepet öğeleri işlenmeye devam edecek
            }
        }
        
        if (siparisler.length > 0) {
            // En az bir sipariş oluşturulduğunda başarılı
            res.json({
                message: "Sipariş oluşturma başarılı", 
                siparisAdedi: siparisler.length
            });
        } else {
            // Hiç sipariş oluşturulamadıysa
            res.status(500).json({message: "Siparişler oluşturulamadı"});
        }
    } catch (error) {
        console.error("Sipariş oluşturma genel hatası:", error);
        // Hata durumunda 500 kodu ile hatayı döndür
        res.status(500).json({message: error.message || "Sipariş işlemi sırasında bir hata oluştu"});
    }
})





//SUNUCU BAŞLATMA 

const port = 5000;
app.listen(5000, ()=>{
    console.log("Uygulama http://localhost:" + port + " üzerinden ayakta!");
});