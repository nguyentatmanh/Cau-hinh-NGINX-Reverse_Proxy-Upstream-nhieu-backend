/**
 * services/productService.js - Tầng Nghiệp vụ (Business Logic)
 * Kiểm tra tính hợp lệ dữ liệu và điều phối các tác vụ sản phẩm
 */
const productRepository = require('../repositories/productRepository');

class ProductService {
    async getAllProducts() {
        return await productRepository.findAll();
    }

    async getProductById(id) {
        if (!id || isNaN(parseInt(id, 10))) {
            const err = new Error('Mã sản phẩm không hợp lệ.');
            err.statusCode = 400;
            throw err;
        }
        const product = await productRepository.findById(id);
        if (!product) {
            const err = new Error(`Không tìm thấy sản phẩm với mã ID: ${id}`);
            err.statusCode = 404;
            throw err;
        }
        return product;
    }

    async createProduct({ name, price, description, imageUrl }) {
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            const err = new Error('Tên sản phẩm không được để trống.');
            err.statusCode = 400;
            throw err;
        }

        const numPrice = parseFloat(price);
        if (isNaN(numPrice) || numPrice < 0) {
            const err = new Error('Đơn giá sản phẩm phải là một số dương hợp lệ.');
            err.statusCode = 400;
            throw err;
        }

        return await productRepository.create({
            name: name.trim(),
            price: numPrice,
            description: (description || '').trim(),
            imageUrl: imageUrl || '/assets/placeholder.png'
        });
    }

    async updateProductImage(id, imageUrl) {
        const product = await this.getProductById(id);
        return await productRepository.updateImage(product.id, imageUrl);
    }
}

module.exports = new ProductService();
