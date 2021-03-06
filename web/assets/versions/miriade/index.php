<?php include('header.inc'); ?>

    <div class="container">

      <div class="row">
        <div class="col-md-9">

          <h1>Description</h1>
          <div class="event-description">
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Debitis dolores ducimus deserunt molestias cum veritatis ipsa expedita corrupti mollitia dolorem quae, excepturi exercitationem tempore, corporis qui fuga nesciunt odio amet ratione natus ex. Soluta expedita recusandae deserunt, voluptatibus iste, quae eius consequuntur, quos, delectus nemo enim autem quas harum atque? Ipsum repellendus totam, sunt suscipit sapiente cumque exercitationem? Molestias a velit impedit cumque praesentium quisquam, eligendi voluptate saepe, aut, veniam sunt repudiandae quod facere iusto dolores accusamus! Rem repellendus, voluptatibus cumque excepturi aperiam, minima molestiae beatae velit magnam deserunt commodi, amet quo. Consequuntur molestiae maiores inventore quidem dignissimos minus eos ad. At inventore odio impedit pariatur corporis beatae ea cum, tempora, itaque nobis quasi. Ad voluptates in voluptatum dicta eos quaerat harum eius ullam beatae cum. Iure veniam mollitia, rerum quia unde quo reprehenderit non sit eaque debitis possimus laboriosam laborum distinctio repellat fugiat tenetur ipsa, minima velit quidem similique repudiandae quam cupiditate. Non dicta aliquam quis voluptate at, tempore provident hic quos labore autem sit quod reprehenderit placeat minus nostrum nobis aut voluptates soluta animi aliquid itaque. Sunt ab ipsum cumque, quis fuga omnis dolor, corporis eveniet voluptatibus iste sapiente dignissimos animi velit. Porro quos ex ducimus voluptatem itaque perferendis, ad, blanditiis minima delectus ipsum quasi! Neque expedita unde commodi adipisci. Harum id expedita sit recusandae exercitationem vitae qui, provident ea doloremque atque, commodi, alias obcaecati doloribus minima, adipisci nemo odit ut ex aut! Architecto ad, facilis velit quae voluptas harum laborum cum beatae id autem quos illum, repellat enim natus hic sint. Quisquam labore incidunt, veniam molestiae iusto eveniet modi culpa aspernatur quidem dolor odio soluta officiis? Obcaecati odio officiis dolore, rem voluptatum aliquid nihil? Consectetur neque quisquam tenetur at iure ab, libero maiores tempore fugit eius voluptate odio nihil omnis vero repellendus nam eum nulla eaque accusamus.</p>
          </div>

          <div class="row">
            <div class="col-md-12">
              <div class="participants-navigation">
                <h3>Participants</h3>
                <nav class="navbar" role="navigation">
                  <div class="container-fluid">

                    <form class="navbar-form navbar-left" role="search">
                      <div class="input-group">
                        <input type="text" class="form-control" placeholder="Search" name="q">

                        <div class="input-group-btn">
                          <button class="btn btn-default" type="submit"><i class="glyphicon glyphicon-search"></i></button>
                        </div>
                      </div>
                      <!-- <button type="submit" class="btn btn-default">Search</button> -->
                      <div class="form-group">
                        <select id="basic" class="selectpicker show-tick form-control" data-live-search="false">
                          <option data-subtext="Personnes et Organisations">Tous</option>
                          <option data-subtext="personnes">Individuels</option>
                          <option data-subtext="organisations">B2B</option>
                        </select>
                      </div>
                    </form>

                  </div>
                  <!-- .container-fluid -->
                </nav>
               
              </div>
            </div>
          </div>
          <!-- /.row -->

          <div class="participants-list">

            <div class="row">
                  <div class="col-sm-3 col-xs-5">
                      <a href="#">
                          <img class="img-responsive" src="img/business-profile.png" alt="">
                      </a>
                  </div>
                  <div class="col-sm-9 col-xs-5">
                      <h3>Profil</h3>
                      <h4>Introtext</h4>
                      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ut, odit velit cumque vero doloremque repellendus distinctio maiores rem expedita a nam vitae modi quidem similique ducimus! Velit, esse totam tempore.</p>
                      <a class="btn btn-success" href="#">Prendre RDV <span class="glyphicon glyphicon-chevron-right"></span></a>
                  </div>
            </div>
            <!-- /.row -->

            <hr>

            <div class="row">
                  <div class="col-sm-3 col-xs-5">
                      <a href="#">
                          <img class="img-responsive" src="img/business-profile.png" alt="">
                      </a>
                  </div>
                  <div class="col-sm-9 col-xs-5">
                      <h3>Profil</h3>
                      <h4>Introtext</h4>
                      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ut, odit velit cumque vero doloremque repellendus distinctio maiores rem expedita a nam vitae modi quidem similique ducimus! Velit, esse totam tempore.</p>
                      <a class="btn btn-success" href="#">Prendre RDV <span class="glyphicon glyphicon-chevron-right"></span></a>
                  </div>
            </div>
            <!-- /.row -->
          </div>
          <!-- /.participants-list -->

          <nav class="participants-pagination-wrap justified">
            <ul class="pagination">
              <li>
                <a href="#" aria-label="Previous">
                  <span aria-hidden="true">&laquo;</span>
                  <span class="sr-only">Previous</span>
                </a>
              </li>
              <li><a href="#">1</a></li>
              <li><a href="#">2</a></li>
              <li><a href="#">3</a></li>
              <li><a href="#">4</a></li>
              <li><a href="#">5</a></li>
              <li>
                <a href="#" aria-label="Next">
                  <span aria-hidden="true">&raquo;</span>
                  <span class="sr-only">Next</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      
      
        <?php include('aside.inc'); ?>

      </div>
      <!-- /.row -->
      <footer>
        <p>&copy; Miriade 2015</p>
      </footer>
    </div> <!-- /container -->

      <?php include('footer.inc'); ?>