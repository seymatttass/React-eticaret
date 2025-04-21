import {useEffect, useState} from 'react';
import axios from 'axios'

function HomeComponent(){
    const [products, setProducts] = useState([]); //ürünleri göstermek için önce yakalamalıyım.

    const getAll = async () =>{  //ürünleri getirelim.
        var response = await axios.get("http://localhost:5000/products");  //axios ile post yapalım.
        setProducts(response.data);
    }

    useEffect(()=> {
        getAll();  //uyg. çalıştığında ürünler gözükecek.
    }, [])

    const addBasket = async(productId) =>{
        let user = JSON.parse(localStorage.getItem("user")); //localstorage daki user a ulaşalım.
        let model = {productId: productId, userId: user._id};
        var response = await axios.post("http://localhost:5000/baskets/add", model); //post yapalım.

        alert(response.data.message);  //alert mesaj

        getAll();
    }

    return(
        <>
        <div className='container'>
            <div className='row'>
                {
                    products.map((product, index) => (
                        <div key={index} className='col-md-3 mt-2'> 
                            <div className='card'>
                                <div className='card-header'>
                                    <h4>{product.name}</h4> 
                                </div>
                                <div className='card-body'>
                                    <img style={{width: "180px", height: "150px"}} src={"http://localhost:5000/" + product.imageUrl}/>
                                    <h4 className='text-center mt-1' style={{border:"1px solid #ccc", padding: "10px"}}>Adet: {product.stock}</h4>
                                    <h4 className='text-center text-danger mt-1' style={{border:"1px solid #ccc", padding: "10px"}}>Fiyat: {product.price}</h4>
                                    {product.stock > 0 ? <button className='btn btn-outline-success w-100'   //adet sıfır olursa sepete ekle butonu kaybolsun.
                                    onClick={()=> addBasket(product._id)}>Sepete Ekle</button> : 
                                    <button className='btn btn-danger w-100'  //stok yoksa kırmızı olsun ve tıklanmasın.
                                    >Ürün Stokta Yok!</button>}  
                                </div>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
        </>
    )
}

export default HomeComponent;