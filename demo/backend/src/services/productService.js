/**
 * services/productService.js - Tầng Nghiệp vụ (Business Logic) Sản phẩm
 * Kiểm tra tính hợp lệ dữ liệu riêng biệt cho Sách (Book) và Khóa học (Course)
 */
const productRepository = require('../repositories/productRepository');

class ProductService {
    async getAllProducts(filters = {}) {
        return await productRepository.findAll(filters);
    }

    async getProductById(id) {
        if (!id || isNaN(parseInt(id, 10))) {
            const err = new Error('Mã sản phẩm (ID) không hợp lệ.');
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

    async createProduct(data) {
        const title = (data.title || data.name || '').trim();
        if (!title) {
            const err = new Error('Tiêu đề sản phẩm không được để trống.');
            err.statusCode = 400;
            throw err;
        }

        const price = parseFloat(data.price);
        if (isNaN(price) || price < 0) {
            const err = new Error('Đơn giá sản phẩm phải là một số dương hợp lệ.');
            err.statusCode = 400;
            throw err;
        }

        const product_type = data.product_type === 'course' ? 'course' : 'book';

        if (product_type === 'book') {
            if (!data.author || !data.author.trim()) {
                const err = new Error('Sách bắt buộc phải có tên Tác giả.');
                err.statusCode = 400;
                throw err;
            }
            const stock = parseInt(data.stock_quantity, 10);
            if (isNaN(stock) || stock < 0) {
                const err = new Error('Số lượng tồn kho của sách phải là số nguyên không âm.');
                err.statusCode = 400;
                throw err;
            }
        } else if (product_type === 'course') {
            if (!data.instructor || !data.instructor.trim()) {
                const err = new Error('Khóa học bắt buộc phải có tên Giảng viên.');
                err.statusCode = 400;
                throw err;
            }
        }

        return await productRepository.create({
            title,
            product_type,
            price,
            description: (data.description || '').trim(),
            cover_image: data.cover_image || data.imageUrl || data.image_url || '/assets/placeholder.svg',
            author: data.author ? data.author.trim() : null,
            isbn: data.isbn ? data.isbn.trim() : null,
            stock_quantity: product_type === 'book' ? (parseInt(data.stock_quantity, 10) || 0) : 0,
            instructor: data.instructor ? data.instructor.trim() : null,
            level: data.level ? data.level.trim() : null,
            duration: data.duration ? data.duration.trim() : null
        });
    }

    async updateProduct(id, data) {
        const existing = await this.getProductById(id);

        const updates = {};
        if (data.title !== undefined) updates.title = data.title.trim();
        if (data.name !== undefined && data.title === undefined) updates.title = data.name.trim();

        if (data.price !== undefined) {
            const price = parseFloat(data.price);
            if (isNaN(price) || price < 0) {
                const err = new Error('Đơn giá sản phẩm phải là một số dương.');
                err.statusCode = 400;
                throw err;
            }
            updates.price = price;
        }

        if (data.description !== undefined) updates.description = data.description.trim();
        if (data.cover_image !== undefined) updates.cover_image = data.cover_image;
        if (data.imageUrl !== undefined && data.cover_image === undefined) updates.cover_image = data.imageUrl;

        const productType = data.product_type || existing.product_type;
        updates.product_type = productType;

        if (productType === 'book') {
            if (data.author !== undefined) updates.author = data.author.trim();
            if (data.isbn !== undefined) updates.isbn = data.isbn.trim();
            if (data.stock_quantity !== undefined) {
                const stock = parseInt(data.stock_quantity, 10);
                if (isNaN(stock) || stock < 0) {
                    const err = new Error('Số lượng tồn kho phải là số nguyên không âm.');
                    err.statusCode = 400;
                    throw err;
                }
                updates.stock_quantity = stock;
            }
        } else if (productType === 'course') {
            if (data.instructor !== undefined) updates.instructor = data.instructor.trim();
            if (data.level !== undefined) updates.level = data.level.trim();
            if (data.duration !== undefined) updates.duration = data.duration.trim();
            updates.stock_quantity = 0;
        }

        return await productRepository.update(existing.id, updates);
    }

    async updateProductImage(id, imageUrl) {
        const product = await this.getProductById(id);
        return await productRepository.updateCoverImage(product.id, imageUrl);
    }
}

module.exports = new ProductService();
