import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

function ProductComponent() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [name, setName] = useState("");
    const [categoryName, setCategoryName] = useState("");
    const [price, setPrice] = useState(0);
    const [stock, setStock] = useState(0);
    

    const getAll = useCallback(async () => { //ürünleri çekelim bu methodla.
        const response = await axios.get("http://localhost:5000/products");
        setProducts(response.data);
    }, []);

    const checkIsAdmin = useCallback(() => {   
        const userJson = localStorage.getItem("user");
        if (userJson) {
            const user = JSON.parse(userJson);
            if (!user.isAdmin) {
                navigate("/");  //admin değilsen ana sayfaya.
            }
        } else {
            // Kullanıcı bilgisi yoksa ana sayfaya yönlendir
            navigate("/");
        }
    }, [navigate]);

    useEffect(() => {
        getAll();
        checkIsAdmin();  //sayfanın başlangıcında çağırmak istediğim için useeffect de çağırdım.
    }, [getAll, checkIsAdmin]);

    const remove = async (_id) => {    //silme methodu yazalım.
        const confirm = window.confirm("Ürünü silmek istiyor musunuz?");
        if (confirm) {      //silmek istiyoru musun diye bir soruyor onaylarsam silecektir.
            const model = { _id: _id };  //model oluşturalım.
            const response = await axios.post("http://localhost:5000/products/remove", model); //axios ile post yapacağım.
            alert(response.data.message);   //alert olarak mesajı döndürsün.
            await getAll();  //listeyi tekrar çekelim yenilenmiş halini.
        }
    };

    const add = async (e) => {
        e.preventDefault();  //sayfa yenilenmesini engelleyelim.
        const input = document.querySelector("input[type='file']"); //input içerisnden type ı file alan inputu bulalım.
        const formData = new FormData();   //formdata oluşturalım.
        //resim dosyaları bir obje old. için ,objeyi doğru bir şekilde  formdata ile gönderebilyoruz.
        //formdata ile gönderince kariı taraf bunu resim olarak,dosya olarak yakalıyor.
        formData.append("name", name);
        formData.append("categoryName", categoryName);
        formData.append("stock", stock);
        formData.append("price", price);
        formData.append("image", input.files[0], input.files[0].name);

        const response = await axios.post("http://localhost:5000/products/add", formData);  //post yapalım.

        alert(response.data.message);  //alert ile mesaj

        getAll();   

        const element = document.getElementById("addModalCloseBtn"); //modal ı kapatmak için.
        element.click();

         //modal tekrar açıldığında sıfırlanmış olaca.
        setName("");
        setPrice(0);
        setStock(0);
        setCategoryName("");  
        input.value = "";  //inputun value sini boşalttık.
    };

    return (
        <>
            <div className="container mt-4">
                <div className="card">
                    <div className="card-header">
                        <h1>Ürün Listesi</h1>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <button data-bs-toggle="modal" data-bs-target="#addModal" className='btn btn-outline-primary'>
                                Ekle
                            </button>
                            <table className="table table-bordered table-hover mt-2"> 
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Resim</th>
                                        <th>Ürün Adı</th>
                                        <th>Kategori Adı</th>
                                        <th>Adet</th>
                                        <th>Fiyatı</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <img 
                                                    style={{ width: "50px" }}   //resmi küçültürüz style ile.
                                                    src={`http://localhost:5000/${product.imageUrl}`}
                                                    alt={`${product.name} ürün görseli`} 
                                                />
                                            </td>
                                            <td>{product.name}</td>
                                            <td>{product.categoryName}</td>
                                            <td>{product.stock}</td>
                                            <td>{product.price}</td>
                                            <td>
                                                <button 
                                                    onClick={() => remove(product._id)} 
                                                    className="btn btn-outline-danger btn-sm"
                                                >
                                                    Sil
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="addModal" tabIndex="-1" aria-labelledby="addModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">  
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5" id="addModalLabel">Ürün Ekle</h1>
                            <button 
                                type="button" 
                                className="btn-close" 
                                data-bs-dismiss="modal" 
                                id="addModalCloseBtn" 
                                aria-label="Close"
                            ></button>
                        </div>
                        <form onSubmit={add}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label htmlFor="name">Ürün Adı</label>
                                    <input 
                                        className="form-control" 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)} 
                                        id="name" 
                                        name="name" 
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="categoryName">Kategori</label>
                                    <select 
                                        className="form-control"
                                        id="categoryName"
                                        name="categoryName"
                                        value={categoryName} 
                                        onChange={(e) => setCategoryName(e.target.value)}
                                    >
                                        <option value="">Seçim Yapınız...</option>
                                        <option>Sebze</option>
                                        <option>Meyve</option>
                                        <option>Teknoloji</option>
                                        <option>Diğer</option>
                                    </select>
                                </div>
                                <div className="form-group mt-2">
                                    <label htmlFor="stock">Stok Adedi</label>
                                    <input 
                                        className="form-control" 
                                        value={stock} 
                                        onChange={(e) => setStock(e.target.value)} 
                                        id="stock" 
                                        name="stock" 
                                        type="number"
                                    />
                                </div>
                                <div className="form-group mt-2">
                                    <label htmlFor="price">Birim Fiyatı</label>
                                    <input 
                                        className="form-control" 
                                        value={price} 
                                        onChange={(e) => setPrice(e.target.value)} 
                                        id="price" 
                                        name="price" 
                                        type="number"
                                    />
                                </div>
                                <div className="form-group mt-2">
                                    <label htmlFor="image">Resmi</label>
                                    <input 
                                        type="file" 
                                        className="form-control" 
                                        id="image" 
                                        name="image" 
                                        accept="image/*"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                                <button type="submit" className="btn btn-primary">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ProductComponent;