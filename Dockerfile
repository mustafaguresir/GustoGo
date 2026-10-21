FROM php:8.2-apache

# SQLite3 ve PDO SQLite desteğini kur
RUN apt-get update && apt-get install -y sqlite3 libsqlite3-dev \
    && docker-php-ext-install pdo pdo_sqlite

# Apache mod_rewrite modülünü aktif et
RUN a2enmod rewrite

# Çalışma dizini
WORKDIR /var/www/html

# Proje kaynak kodlarını kopyala
COPY . /var/www/html/

# Apache DocumentRoot'u /public dizinine yönlendir
RUN sed -ri -e 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!/var/www/html/public!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Veritabanı ve depolama izinlerini ayarla
RUN chown -R www-data:www-data /var/www/html/database /var/www/html/storage \
    && chmod -R 775 /var/www/html/database /var/www/html/storage

EXPOSE 80
CMD ["apache2-foreground"]
